/**
 * Spreaker API Client
 * Handles show creation and episode publishing
 */

const SPREAKER_API = 'https://api.spreaker.com/v2';
const USER_ID = '17313059';

// Get API key from environment
function getApiKey(): string {
  const key = process.env.SPREAKER_API_KEY;
  if (!key) {
    throw new Error('SPREAKER_API_KEY not configured');
  }
  return key;
}

// ============ TYPES ============

export interface SpreakerCategory {
  category_id: number;
  name: string;
  permalink: string;
  level: number;
}

export interface SpreakerShow {
  show_id: number;
  title: string;
  description?: string;
  site_url: string;
  image_url?: string;
  category_id?: number;
  category_2_id?: number;
  category_3_id?: number;
}

export interface SpreakerEpisode {
  episode_id: number;
  title: string;
  description?: string;
  site_url: string;
  show_id: number;
  duration?: number;
}

export interface CreateShowRequest {
  title: string;
  description: string;
  language?: string;
  category_id?: number;
  category_2_id?: number;
  category_3_id?: number;
  owner_name?: string;
  author_name?: string;
  copyright?: string;
  email?: string;
  website_url?: string;
  artworkUrl?: string; // We'll download and upload
}

export interface CreateEpisodeRequest {
  show_id: number;
  title: string;
  description: string;
  audioUrl: string; // URL to download audio from
  tags?: string[];
  explicit?: boolean;
  season_number?: number;
  episode_number?: number;
  season_episode_type?: 'FULL' | 'TRAILER' | 'BONUS';
  ai_generated?: boolean;
}

// ============ API FUNCTIONS ============

/**
 * Get all Spreaker categories
 */
export async function getCategories(): Promise<SpreakerCategory[]> {
  const res = await fetch(`${SPREAKER_API}/show-categories`, {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  
  const data = await res.json();
  return data.response.categories || [];
}

/**
 * Get user's existing shows
 */
export async function getShows(): Promise<SpreakerShow[]> {
  const res = await fetch(`${SPREAKER_API}/users/${USER_ID}/shows?limit=100`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch shows: ${res.status}`);
  }
  
  const data = await res.json();
  return data.response.items || [];
}

/**
 * Create a new show
 */
export async function createShow(req: CreateShowRequest): Promise<SpreakerShow> {
  const formData = new FormData();
  formData.append('title', req.title);
  formData.append('description', req.description);
  formData.append('language', req.language || 'en');
  formData.append('email', req.email || 'corboo@mac.com');
  formData.append('owner_name', req.owner_name || 'Quiet. Please');
  formData.append('author_name', req.author_name || 'Inception Point Ai');
  formData.append('copyright', req.copyright || 'Copyright 2026 Inception Point Ai');
  
  if (req.category_id) formData.append('category_id', req.category_id.toString());
  if (req.category_2_id) formData.append('category_2_id', req.category_2_id.toString());
  if (req.category_3_id) formData.append('category_3_id', req.category_3_id.toString());
  if (req.website_url) formData.append('website_url', req.website_url);
  
  // Download and attach artwork if provided
  if (req.artworkUrl) {
    try {
      const artworkRes = await fetch(req.artworkUrl);
      if (artworkRes.ok) {
        const artworkBlob = await artworkRes.blob();
        formData.append('image_file', artworkBlob, 'artwork.jpg');
      }
    } catch (e) {
      console.warn('Failed to download artwork:', e);
    }
  }
  
  const res = await fetch(`${SPREAKER_API}/shows`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create show: ${res.status} - ${error}`);
  }
  
  const data = await res.json();
  return data.response.show;
}

/**
 * Create/upload a new episode
 */
export async function createEpisode(req: CreateEpisodeRequest): Promise<SpreakerEpisode> {
  // First, download the audio file
  console.log(`[Spreaker] Downloading audio from: ${req.audioUrl}`);
  const audioRes = await fetch(req.audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to download audio: ${audioRes.status}`);
  }
  const audioBlob = await audioRes.blob();
  console.log(`[Spreaker] Downloaded audio: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Build form data
  const formData = new FormData();
  formData.append('title', req.title);
  formData.append('description', req.description);
  formData.append('media_file', audioBlob, 'episode.mp3');
  
  // Optional fields
  if (req.tags && req.tags.length > 0) {
    formData.append('tags', req.tags.join(','));
  }
  if (req.explicit !== undefined) {
    formData.append('explicit', req.explicit.toString());
  }
  if (req.season_number !== undefined) {
    formData.append('season_number', req.season_number.toString());
  }
  if (req.episode_number !== undefined) {
    formData.append('episode_number', req.episode_number.toString());
  }
  if (req.season_episode_type) {
    formData.append('season_episode_type', req.season_episode_type);
  }
  if (req.ai_generated !== undefined) {
    formData.append('ai_generated', req.ai_generated.toString());
  }
  
  console.log(`[Spreaker] Uploading episode to show ${req.show_id}...`);
  const res = await fetch(`${SPREAKER_API}/shows/${req.show_id}/episodes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create episode: ${res.status} - ${error}`);
  }
  
  const data = await res.json();
  console.log(`[Spreaker] Episode created: ${data.response.episode.site_url}`);
  return data.response.episode;
}

/**
 * High-level: Publish podcast content to Spreaker
 * Handles both new shows and episodes
 */
export async function publishToSpreaker(content: {
  title: string;
  description: string;
  audioUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  spreaker?: {
    isNewShow?: boolean;
    showId?: number;
    category_id?: number;
    category_2_id?: number;
    category_3_id?: number;
    owner_name?: string;
    author_name?: string;
    copyright?: string;
    email?: string;
    website_url?: string;
    season_number?: number;
    episode_number?: number;
    episode_type?: 'FULL' | 'TRAILER' | 'BONUS';
    explicit?: boolean;
  };
}): Promise<{ show: SpreakerShow; episode: SpreakerEpisode }> {
  const spreaker = content.spreaker || {};
  
  let show: SpreakerShow;
  
  if (spreaker.isNewShow || !spreaker.showId) {
    // Create new show first
    console.log(`[Spreaker] Creating new show: ${content.title}`);
    show = await createShow({
      title: content.title,
      description: content.description,
      category_id: spreaker.category_id,
      category_2_id: spreaker.category_2_id,
      category_3_id: spreaker.category_3_id,
      owner_name: spreaker.owner_name,
      author_name: spreaker.author_name,
      copyright: spreaker.copyright,
      email: spreaker.email,
      website_url: spreaker.website_url,
      artworkUrl: content.thumbnailUrl,
    });
    console.log(`[Spreaker] Show created: ${show.show_id} - ${show.site_url}`);
  } else {
    // Use existing show
    const shows = await getShows();
    const existing = shows.find(s => s.show_id === spreaker.showId);
    if (!existing) {
      throw new Error(`Show ${spreaker.showId} not found`);
    }
    show = existing;
    console.log(`[Spreaker] Using existing show: ${show.title}`);
  }
  
  // Create episode
  const episode = await createEpisode({
    show_id: show.show_id,
    title: content.title,
    description: content.description,
    audioUrl: content.audioUrl,
    tags: content.tags,
    explicit: spreaker.explicit,
    season_number: spreaker.season_number,
    episode_number: spreaker.episode_number,
    season_episode_type: spreaker.episode_type,
    ai_generated: true, // Always true for our AI-generated content
  });
  
  return { show, episode };
}
