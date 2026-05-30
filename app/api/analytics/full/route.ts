import { NextResponse } from 'next/server';
import { getAllMondayStats } from '@/lib/spreaker-analytics';
import { getChannelStats, getRecentVideos } from '@/lib/youtube-analytics';
import { getInstagramAnalytics } from '@/lib/instagram-analytics';

/**
 * GET /api/analytics/full - Full analytics including Spreaker, YouTube, Instagram, and suggestions
 */
export async function GET() {
  try {
    // Fetch Spreaker, YouTube, and Instagram data in parallel
    const [spreakerData, youtubeStats, youtubeVideos, instagramData] = await Promise.all([
      getAllMondayStats(),
      getChannelStats(),
      getRecentVideos(10),
      getInstagramAnalytics(),
    ]);

    // Add scheduling recommendations
    const showsWithPriority = spreakerData.shows.map((show, idx) => ({
      ...show,
      priority: idx + 1,
      pct_of_total: spreakerData.total_downloads > 0 
        ? Math.round(show.downloads_count / spreakerData.total_downloads * 1000) / 10 
        : 0,
      suggested_frequency: idx < 3 ? "2x/week" : idx < 6 ? "weekly" : "bi-weekly",
    }));

    // Generate new show suggestions based on data analysis
    const suggestions = generateShowSuggestions(spreakerData.shows);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      spreaker: {
        data_source: "Spreaker API",
        total_downloads: spreakerData.total_downloads,
        total_plays: spreakerData.total_plays,
        total_episodes: spreakerData.total_episodes,
        shows: showsWithPriority,
        top_episodes: spreakerData.top_episodes,
      },
      youtube: {
        data_source: "YouTube Data API",
        stats: youtubeStats,
        videos: youtubeVideos,
      },
      instagram: instagramData,
      suggestions,
    });
  } catch (error) {
    console.error('Failed to fetch full analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate new show suggestions based on existing performance data
 */
function generateShowSuggestions(shows: Array<{ title: string; downloads_count: number; episodes_count: number }>): string[] {
  const suggestions = [
    "Garden SOS — Weekly listener call-in show where Nigel diagnoses garden problems from photos and descriptions. High engagement format.",
    "Seasonal Planner — Monthly deep-dive into what to plant, prune, and prepare. Evergreen content that drives repeat listens each year.",
    "The Potting Shed — Casual chat format covering garden news, new varieties, and tool reviews. Low production cost, high personality.",
    "From Seed to Table — Crossover with Claire Delish: grow it, then cook it. Two personalities, double the audience.",
    "Wildlife Garden — Focus on biodiversity, pollinator-friendly planting, and rewilding. Trending topic with passionate community.",
  ];

  return suggestions;
}
