/**
 * YouTube Analytics for Nigel channel
 */

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.warn('[YouTube Analytics] YOUTUBE_API_KEY not configured');
}

// Agent Monday's YouTube channel (placeholder — to be configured)
export const MONDAY_YOUTUBE_CHANNEL = {
  id: '',
  name: 'Agent Monday',
};

export interface YouTubeChannelStats {
  channel_id: string;
  channel_name: string;
  subscribers: number;
  total_views: number;
  video_count: number;
}

export interface YouTubeVideo {
  video_id: string;
  title: string;
  published_at: string;
  thumbnail_url?: string;
  view_count?: number;
}

export async function getChannelStats(): Promise<YouTubeChannelStats | null> {
  try {
    const res = await fetch(
      `${YOUTUBE_API}/channels?part=statistics,snippet&id=${MONDAY_YOUTUBE_CHANNEL.id}&key=${API_KEY}`
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const channel = data.items?.[0];
    if (!channel) return null;
    
    return {
      channel_id: MONDAY_YOUTUBE_CHANNEL.id,
      channel_name: channel.snippet?.title || MONDAY_YOUTUBE_CHANNEL.name,
      subscribers: parseInt(channel.statistics?.subscriberCount || '0'),
      total_views: parseInt(channel.statistics?.viewCount || '0'),
      video_count: parseInt(channel.statistics?.videoCount || '0'),
    };
  } catch (error) {
    console.error('Failed to fetch YouTube channel stats:', error);
    return null;
  }
}

export async function getRecentVideos(limit: number = 10): Promise<YouTubeVideo[]> {
  try {
    // Get video IDs
    const searchRes = await fetch(
      `${YOUTUBE_API}/search?part=snippet&channelId=${MONDAY_YOUTUBE_CHANNEL.id}&order=date&maxResults=${limit}&type=video&key=${API_KEY}`
    );
    
    if (!searchRes.ok) return [];
    
    const searchData = await searchRes.json();
    const videos: YouTubeVideo[] = [];
    
    for (const item of searchData.items || []) {
      videos.push({
        video_id: item.id.videoId,
        title: item.snippet.title,
        published_at: item.snippet.publishedAt,
        thumbnail_url: item.snippet.thumbnails?.medium?.url,
      });
    }
    
    // Get view counts
    if (videos.length > 0) {
      const videoIds = videos.map(v => v.video_id).join(',');
      const statsRes = await fetch(
        `${YOUTUBE_API}/videos?part=statistics&id=${videoIds}&key=${API_KEY}`
      );
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        for (const stat of statsData.items || []) {
          const video = videos.find(v => v.video_id === stat.id);
          if (video) {
            video.view_count = parseInt(stat.statistics?.viewCount || '0');
          }
        }
      }
    }
    
    return videos;
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error);
    return [];
  }
}
