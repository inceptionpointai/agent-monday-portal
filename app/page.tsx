'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ContentType = 'tiktok' | 'youtube-short' | 'youtube-long' | 'instagram-post' | 'instagram-reel' | 'podcast' | 'blog' | 'book' | 'facebook-post' | 'twitter-post';

interface ContentItem {
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
  feedback?: string;
  cost?: number;
  duration?: string;
  metadata?: Record<string, string>;
}

const SHOW_COLORS: Record<string, string> = {
  "Monday's Report": 'bg-amber-600 text-white',
  "The Docket": 'bg-indigo-800 text-white',
  "Cold Case Monday": 'bg-slate-700 text-white',
  "White Collar Wednesday": 'bg-emerald-700 text-white',
  "Breaking": 'bg-red-700 text-white',
  "The Booking Log": 'bg-orange-600 text-white',
};

const SHOW_ICONS: Record<string, string> = {
  "Monday's Report": '📋',
  "The Docket": '⚖️',
  "Cold Case Monday": '🔍',
  "White Collar Wednesday": '💼',
  "Breaking": '🚨',
  "The Booking Log": '📖',
};

export default function Home() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [showFilter, setShowFilter] = useState<string>('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const allShows = Array.from(new Set(items.map(i => i.metadata?.Series).filter(Boolean))) as string[];

  const filteredItems = items.filter(item => {
    const statusMatch = filter === 'all' ? true : item.status === filter;
    const typeMatch = typeFilter === 'all' ? true : item.contentType === typeFilter;
    const showMatch = showFilter === 'all' ? true : item.metadata?.Series === showFilter;
    return statusMatch && typeMatch && showMatch;
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const channelIcons: Record<string, string> = {
    youtube: '📺',
    'youtube-shorts': '📱',
    'youtube-long': '🎬',
    podcast: '🎙️',
    twitter: '🐦',
    instagram: '📸',
    'instagram-reels': '🎞️',
    tiktok: '🎵',
  };

  const contentTypeInfo: Record<ContentType, { icon: string; label: string; color: string }> = {
    'tiktok': { icon: '🎵', label: 'TikTok', color: 'bg-pink-100 text-pink-800' },
    'youtube-short': { icon: '📱', label: 'YT Short', color: 'bg-red-100 text-red-800' },
    'youtube-long': { icon: '🎬', label: 'YouTube', color: 'bg-red-100 text-red-800' },
    'instagram-post': { icon: '📸', label: 'IG Post', color: 'bg-purple-100 text-purple-800' },
    'instagram-reel': { icon: '🎞️', label: 'IG Reel', color: 'bg-purple-100 text-purple-800' },
    'podcast': { icon: '🎙️', label: 'Podcast', color: 'bg-amber-100 text-amber-800' },
    'blog': { icon: '📝', label: 'Blog', color: 'bg-blue-100 text-blue-800' },
    'book': { icon: '📚', label: 'Book', color: 'bg-amber-100 text-amber-800' },
    'facebook-post': { icon: '📘', label: 'Facebook', color: 'bg-indigo-100 text-indigo-800' },
    'twitter-post': { icon: '🐦', label: 'Twitter', color: 'bg-sky-100 text-sky-800' },
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <header className="bg-[#1a1a2e] shadow-lg border-b border-[#d4a037]/30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#d4a037] tracking-wide">🕵️ Agent Monday — Content Review Portal</h1>
              <p className="text-sm text-gray-400">Review and approve content before it hits the public record</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-[#d4a037] text-[#1a1a2e]'
                        : 'bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e]'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && (
                      <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-full text-xs">
                        {items.filter(i => i.status === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setShowFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    showFilter === 'all' ? 'bg-[#d4a037] text-[#1a1a2e]' : 'bg-[#2a2a3e] text-gray-400 hover:bg-[#3a3a4e]'
                  }`}
                >
                  All Shows
                </button>
                {allShows.map((show) => (
                  <button
                    key={show}
                    onClick={() => setShowFilter(show)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      showFilter === show 
                        ? (SHOW_COLORS[show] || 'bg-[#d4a037] text-[#1a1a2e]') + ' ring-2 ring-offset-1 ring-offset-[#0d0d1a]'
                        : 'bg-[#2a2a3e] text-gray-400 hover:bg-[#3a3a4e]'
                    }`}
                  >
                    {SHOW_ICONS[show] || '📋'} {show}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2a2a3e] border-b border-[#d4a037]/20">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-gray-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕵️</span>
              <div>
                <span className="font-semibold text-[#d4a037]">Monday Factory</span>
                <span className="mx-2 text-gray-600">•</span>
                <span className="text-gray-400">{items.length} items in queue</span>
                <span className="mx-2 text-gray-600">•</span>
                <span className="text-amber-400">{items.filter(i => i.status === 'pending').length} pending review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a037] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading the docket...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a2e] rounded-xl shadow-sm border border-[#2a2a3e]">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-200">No {filter === 'all' ? '' : filter} content</h3>
            <p className="text-gray-500 mt-1">
              {filter === 'pending' 
                ? 'The docket is clear. Check back later.'
                : `No ${filter} items yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/review/${item.id}`}
                className="bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:shadow-[#d4a037]/10 transition-all border border-[#2a2a3e] hover:border-[#d4a037]/40"
              >
                {/* Thumbnail / Show Header */}
                <div className="aspect-video bg-[#0d0d1a] relative flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl">{SHOW_ICONS[item.metadata?.Series || ''] || '🎙️'}</span>
                    <div className="mt-2 text-gray-500 text-sm font-medium">{item.metadata?.Series || 'Podcast'}</div>
                  </div>
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                  {item.metadata?.Series && SHOW_COLORS[item.metadata.Series] && (
                    <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${SHOW_COLORS[item.metadata.Series]}`}>
                      {item.metadata.Series}
                    </span>
                  )}
                  {item.metadata?.Duration && (
                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                      ⏱ {item.metadata.Duration}
                    </span>
                  )}
                  {item.metadata?.Episode && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-mono font-medium bg-[#d4a037]/20 text-[#d4a037]">
                      {item.metadata.Episode}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-100 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1">
                      {item.channels.map((ch) => (
                        <span key={ch} title={ch} className="text-lg">
                          {channelIcons[ch.toLowerCase()] || '📢'}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      by <span className="text-[#d4a037]">{item.creator}</span> • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e] bg-[#1a1a2e] mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          Content Review Portal • Monday Factory • Inception Point AI
        </div>
      </footer>
    </div>
  );
}
