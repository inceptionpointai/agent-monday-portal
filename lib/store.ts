import { kv } from '@vercel/kv';
import * as fs from 'fs';
import * as path from 'path';

export type ContentType = 
  | 'tiktok' 
  | 'youtube-short' 
  | 'youtube-long' 
  | 'instagram-post' 
  | 'instagram-reel' 
  | 'podcast';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType?: ContentType;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  creator: string;
  channels: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  feedback?: string;
  cost?: number;
  duration?: string;
  metadata?: Record<string, string>;
  isDraft?: boolean; // If true, this is a script/idea awaiting asset generation
}

const CONTENT_KEY = 'content:items';

// Fallback for when KV isn't configured
let memoryFallback: ContentItem[] = [];
let seeded = false;

function seedFromFile() {
  if (seeded) return;
  try {
    const filePath = path.join(process.cwd(), 'data', 'content.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (data.items && data.items.length > 0 && memoryFallback.length === 0) {
      memoryFallback = data.items;
      console.log('[Store] Seeded', data.items.length, 'items from content.json');
    }
  } catch (e) {
    console.log('[Store] No seed file or error:', e);
  }
  seeded = true;
}

async function isKVConfigured(): Promise<boolean> {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getAllContent(): Promise<ContentItem[]> {
  if (!(await isKVConfigured())) {
    seedFromFile();
    return memoryFallback;
  }
  
  try {
    const items = await kv.get<ContentItem[]>(CONTENT_KEY);
    return items || [];
  } catch (e) {
    console.error('[Store] KV get error:', e);
    return memoryFallback;
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const items = await getAllContent();
  return items.find(item => item.id === id) || null;
}

export async function addContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'status'>): Promise<ContentItem> {
  const items = await getAllContent();
  
  const newItem: ContentItem = {
    ...item,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  items.unshift(newItem);
  
  if (await isKVConfigured()) {
    try {
      await kv.set(CONTENT_KEY, items);
    } catch (e) {
      console.error('[Store] KV set error:', e);
      memoryFallback = items;
    }
  } else {
    memoryFallback = items;
  }
  
  return newItem;
}

export async function updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
  const items = await getAllContent();
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  if (await isKVConfigured()) {
    try {
      await kv.set(CONTENT_KEY, items);
    } catch (e) {
      console.error('[Store] KV set error:', e);
      memoryFallback = items;
    }
  } else {
    memoryFallback = items;
  }
  
  return items[index];
}

export async function deleteContent(id: string): Promise<boolean> {
  const items = await getAllContent();
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) return false;
  
  items.splice(index, 1);
  
  if (await isKVConfigured()) {
    try {
      await kv.set(CONTENT_KEY, items);
    } catch (e) {
      console.error('[Store] KV set error:', e);
      memoryFallback = items;
    }
  } else {
    memoryFallback = items;
  }
  
  return true;
}

export async function deleteMultiple(ids: string[]): Promise<number> {
  const items = await getAllContent();
  const idsSet = new Set(ids);
  const filtered = items.filter(item => !idsSet.has(item.id));
  const deletedCount = items.length - filtered.length;
  
  if (await isKVConfigured()) {
    try {
      await kv.set(CONTENT_KEY, filtered);
    } catch (e) {
      console.error('[Store] KV set error:', e);
      memoryFallback = filtered;
    }
  } else {
    memoryFallback = filtered;
  }
  
  return deletedCount;
}

export async function cleanupNoVideo(): Promise<{ deleted: number; remaining: number }> {
  const items = await getAllContent();
  const withVideo = items.filter(item => item.videoUrl && item.videoUrl.trim() !== '');
  const deletedCount = items.length - withVideo.length;
  
  if (await isKVConfigured()) {
    try {
      await kv.set(CONTENT_KEY, withVideo);
    } catch (e) {
      console.error('[Store] KV set error:', e);
      memoryFallback = withVideo;
    }
  } else {
    memoryFallback = withVideo;
  }
  
  return { deleted: deletedCount, remaining: withVideo.length };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
