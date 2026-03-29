/**
 * Spreaker Analytics - Pull stats directly from Spreaker API
 * Full history from start of show, episode-level data
 */

const SPREAKER_API = 'https://api.spreaker.com/v2';

function getApiKey(): string {
  const key = process.env.SPREAKER_API_KEY;
  if (!key) {
    throw new Error('SPREAKER_API_KEY not configured');
  }
  return key;
}

// Agent Monday's target shows (placeholder IDs — will be updated when shows are created)
export const MONDAY_SHOW_IDS: number[] = [];

export interface ShowStats {
  show_id: number;
  title: string;
  plays_count: number;
  downloads_count: number;
  episodes_count: number;
  last_episode_at?: string;
  site_url?: string;
  image_url?: string;
}

export interface EpisodeStats {
  episode_id: number;
  show_id: number;
  title: string;
  plays_count: number;
  downloads_count: number;
  published_at: string;
  duration?: number;
}

/**
 * Get all-time statistics for a show
 */
export async function getShowStats(showId: number): Promise<ShowStats | null> {
  try {
    const [statsRes, showRes] = await Promise.all([
      fetch(`${SPREAKER_API}/shows/${showId}/statistics`, {
        headers: { 'Authorization': `Bearer ${getApiKey()}` },
      }),
      fetch(`${SPREAKER_API}/shows/${showId}`, {
        headers: { 'Accept': 'application/json' },
      }),
    ]);
    
    if (!statsRes.ok) return null;
    
    const statsData = await statsRes.json();
    const showData = showRes.ok ? await showRes.json() : null;
    const stats = statsData.response?.statistics;
    const show = showData?.response?.show;
    
    return {
      show_id: showId,
      title: show?.title || `Show ${showId}`,
      plays_count: stats?.plays_count || 0,
      downloads_count: stats?.downloads_count || 0,
      episodes_count: stats?.episodes_count || 0,
      last_episode_at: show?.last_episode_at,
      site_url: show?.site_url,
      image_url: show?.image_url,
    };
  } catch (error) {
    console.error(`Failed to get stats for show ${showId}:`, error);
    return null;
  }
}

/**
 * Get recent episodes for a show with their stats
 */
export async function getShowEpisodes(showId: number, limit: number = 10): Promise<EpisodeStats[]> {
  try {
    const res = await fetch(
      `${SPREAKER_API}/shows/${showId}/episodes?limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${getApiKey()}` } }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const episodes = data.response?.items || [];
    
    return episodes.map((ep: any) => ({
      episode_id: ep.episode_id,
      show_id: showId,
      title: ep.title,
      plays_count: ep.plays_count || 0,
      downloads_count: ep.downloads_count || 0,
      published_at: ep.published_at,
      duration: ep.duration,
    }));
  } catch (error) {
    console.error(`Failed to get episodes for show ${showId}:`, error);
    return [];
  }
}

/**
 * Get analytics for all Agent Monday shows
 */
export async function getAllMondayStats(): Promise<{
  shows: ShowStats[];
  total_plays: number;
  total_downloads: number;
  total_episodes: number;
  top_episodes: EpisodeStats[];
}> {
  if (MONDAY_SHOW_IDS.length === 0) {
    return {
      shows: [],
      total_plays: 0,
      total_downloads: 0,
      total_episodes: 0,
      top_episodes: [],
    };
  }

  // Fetch all show stats in parallel
  const showStatsPromises = MONDAY_SHOW_IDS.map(id => getShowStats(id));
  const showStats = await Promise.all(showStatsPromises);
  
  // Filter out nulls and sort by downloads
  const validShows = showStats
    .filter((s): s is ShowStats => s !== null)
    .sort((a, b) => b.downloads_count - a.downloads_count);
  
  // Get recent episodes from top 3 shows
  const topShowIds = validShows.slice(0, 3).map(s => s.show_id);
  const episodePromises = topShowIds.map(id => getShowEpisodes(id, 5));
  const episodeArrays = await Promise.all(episodePromises);
  const topEpisodes = episodeArrays
    .flat()
    .sort((a, b) => b.downloads_count - a.downloads_count)
    .slice(0, 10);
  
  // Calculate totals
  const total_plays = validShows.reduce((sum, s) => sum + s.plays_count, 0);
  const total_downloads = validShows.reduce((sum, s) => sum + s.downloads_count, 0);
  const total_episodes = validShows.reduce((sum, s) => sum + s.episodes_count, 0);
  
  return {
    shows: validShows,
    total_plays,
    total_downloads,
    total_episodes,
    top_episodes: topEpisodes,
  };
}
