import { NextResponse } from 'next/server';
import { getAllMondayStats } from '@/lib/spreaker-analytics';
import { getChannelStats, getRecentVideos } from '@/lib/youtube-analytics';

/**
 * GET /api/analytics/full - Full analytics including Spreaker, YouTube, and suggestions
 */
export async function GET() {
  try {
    // Fetch Spreaker and YouTube data in parallel
    const [spreakerData, youtubeStats, youtubeVideos] = await Promise.all([
      getAllMondayStats(),
      getChannelStats(),
      getRecentVideos(10),
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
  // Analyze what's working
  const topPerformers = shows.slice(0, 3).map(s => s.title.toLowerCase());
  
  // Generate suggestions based on gaps and opportunities
  const suggestions = [
    "Jury Box — Weekly show following active high-profile trials. Real-time docket updates, jury selection analysis, verdict predictions. Pure public record.",
    "The Informant — Deep investigative episodes on whistleblower cases and cooperating witness testimony. The people who flip and the deals they cut.",
    "Monday's Most Wanted — Partnership with U.S. Marshals fugitive updates. Weekly profiles of active federal fugitives with case backgrounds.",
    "Sentencing Monday — Focus on notable sentencing hearings. What judges say, what guidelines recommend, and why sentences land where they do.",
    "The Evidence Locker — Forensic science deep dives. DNA genealogy, digital forensics, ballistics. How the science catches the criminals.",
  ];

  return suggestions;
}
