import { NextResponse } from 'next/server';
import { getAllMondayStats, MONDAY_SHOW_IDS } from '@/lib/spreaker-analytics';

/**
 * GET /api/analytics - Get Agent Monday show analytics from Spreaker API
 * Full history from start of shows, episode-level data
 */
export async function GET() {
  try {
    const data = await getAllMondayStats();
    
    // Add scheduling recommendations based on performance
    const showsWithPriority = data.shows.map((show, idx) => ({
      ...show,
      priority: idx + 1,
      pct_of_total: data.total_downloads > 0 
        ? Math.round(show.downloads_count / data.total_downloads * 1000) / 10 
        : 0,
      suggested_frequency: idx < 3 ? "2x/week" : idx < 6 ? "weekly" : "bi-weekly",
    }));
    
    return NextResponse.json({
      data_source: "Spreaker API",
      generated_at: new Date().toISOString(),
      period: "all-time",
      monday_show_ids: MONDAY_SHOW_IDS,
      analytics: {
        total_downloads: data.total_downloads,
        total_plays: data.total_plays,
        total_episodes: data.total_episodes,
        shows: showsWithPriority,
      },
      top_episodes: data.top_episodes,
      scheduling_priority: showsWithPriority.map(s => ({
        show_id: s.show_id,
        title: s.title,
        priority: s.priority,
        suggested_frequency: s.suggested_frequency,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch analytics from Spreaker', details: String(error) },
      { status: 500 }
    );
  }
}
