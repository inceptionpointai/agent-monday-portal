'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type ContentType = 'tiktok' | 'youtube-short' | 'youtube-long' | 'instagram-post' | 'instagram-reel' | 'podcast';

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

interface SpreakerCategory {
  id: number;
  name: string;
}

interface SpreakerShow {
  id: number;
  title: string;
  imageUrl?: string;
}

interface SpreakerConfig {
  isNewShow: boolean;
  showId?: number;
  title: string;
  description: string;
  tags: string;
  category_id?: number;
  category_2_id?: number;
  category_3_id?: number;
  owner_name: string;
  author_name: string;
  copyright: string;
  email: string;
  website_url: string;
  season_number?: number;
  episode_number?: number;
  episode_type: 'FULL' | 'TRAILER' | 'BONUS';
  explicit: boolean;
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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const [spreakerData, setSpreakerData] = useState<{
    categories: SpreakerCategory[];
    shows: SpreakerShow[];
  }>({ categories: [], shows: [] });
  const [spreakerConfig, setSpreakerConfig] = useState<SpreakerConfig>({
    isNewShow: false,
    title: '',
    description: '',
    tags: '',
    owner_name: 'Quiet. Please',
    author_name: 'Inception Point Ai',
    copyright: 'Copyright 2026 Inception Point Ai',
    email: 'corboo@mac.com',
    website_url: 'https://www.quietperiodplease.com/',
    episode_type: 'FULL',
    explicit: false,
  });
  const [publishResult, setPublishResult] = useState<{
    success?: boolean;
    episodeUrl?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetchItem();
    fetchSpreakerData();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/content/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);
        setSelectedChannels(data.channels || []);
        setSpreakerConfig(prev => ({
          ...prev,
          title: data.title || '',
          description: data.description || '',
          tags: data.metadata?.tags || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpreakerData = async () => {
    try {
      const res = await fetch('/api/spreaker');
      if (res.ok) {
        const data = await res.json();
        setSpreakerData(data);
      }
    } catch (error) {
      console.error('Failed to fetch Spreaker data:', error);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!item) return;
    setSubmitting(true);
    setPublishResult(null);

    try {
      const body: Record<string, unknown> = {
        feedback,
        channels: selectedChannels,
      };

      if (action === 'approve' && (selectedChannels.includes('spreaker') || selectedChannels.includes('podcast'))) {
        body.spreaker = {
          ...spreakerConfig,
          tags: spreakerConfig.tags.split(',').map(t => t.trim()).filter(Boolean),
        };
      }

      const res = await fetch(`/api/content/${item.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok) {
        if (result.publishResults?.spreaker) {
          setPublishResult({
            success: result.publishResults.spreaker.success,
            episodeUrl: result.publishResults.spreaker.episodeUrl,
            error: result.publishResults.spreaker.error,
          });
          
          if (result.publishResults.spreaker.success) {
            setTimeout(() => router.push('/?action=' + action), 2000);
            return;
          }
        } else {
          router.push('/?action=' + action);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const updateSpreakerConfig = (key: keyof SpreakerConfig, value: unknown) => {
    setSpreakerConfig(prev => ({ ...prev, [key]: value }));
  };

  const channelOptions = [
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'youtube-shorts', name: 'YT Shorts', icon: '📱' },
    { id: 'podcast', name: 'Podcast', icon: '🎙️' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
    { id: 'instagram', name: 'Instagram', icon: '📸' },
    { id: 'instagram-reels', name: 'IG Reels', icon: '🎞️' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'spreaker', name: 'Spreaker', icon: '🔊' },
  ];

  const isPodcast = item?.contentType === 'podcast' || 
    selectedChannels.includes('spreaker') || 
    selectedChannels.includes('podcast');

  const showName = item?.metadata?.Series || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a037]"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-200">Content not found</h2>
          <Link href="/" className="text-[#d4a037] hover:underline mt-2 block">
            ← Back to the docket
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-amber-900/50 text-amber-300 border-amber-600',
    approved: 'bg-green-900/50 text-green-300 border-green-600',
    rejected: 'bg-red-900/50 text-red-300 border-red-600',
  };

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <header className="bg-[#1a1a2e] shadow-lg border-b border-[#d4a037]/30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-[#d4a037] transition-colors"
            >
              ← Back
            </Link>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[item.status]}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
            {showName && SHOW_COLORS[showName] && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${SHOW_COLORS[showName]}`}>
                {SHOW_ICONS[showName] || '🎙️'} {showName}
              </span>
            )}
            {isPodcast && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#d4a037]/20 text-[#d4a037] border border-[#d4a037]/40">
                🎙️ Podcast
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Publish Result Alert */}
      {publishResult && (
        <div className={`border-b ${publishResult.success ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            {publishResult.success ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-300">Published to Spreaker!</p>
                  {publishResult.episodeUrl && (
                    <a href={publishResult.episodeUrl} target="_blank" rel="noopener noreferrer"
                      className="text-green-400 hover:underline text-sm">{publishResult.episodeUrl} →</a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-medium text-red-300">Spreaker publish failed</p>
                  <p className="text-red-400 text-sm">{publishResult.error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Content Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden border border-[#2a2a3e]">
              <div className={`${item.contentType === 'podcast' ? 'aspect-[3/1]' : 'aspect-video'} bg-[#0d0d1a]`}>
                {item.videoUrl ? (
                  <video src={item.videoUrl} controls className="w-full h-full" poster={item.thumbnailUrl} />
                ) : item.audioUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] p-8">
                    <span className="text-6xl mb-4">{SHOW_ICONS[showName] || '🎙️'}</span>
                    <audio src={item.audioUrl} controls className="w-full max-w-md" />
                    {item.duration && <span className="text-gray-500 mt-2 text-sm">{item.duration}</span>}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <span className="text-7xl">{SHOW_ICONS[showName] || '🕵️'}</span>
                    <span className="text-sm mt-2 text-gray-600">{showName || 'Agent Monday'}</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-100">{item.title}</h1>
                <p className="mt-4 text-gray-300 whitespace-pre-line leading-relaxed">{item.description}</p>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>Created by <strong className="text-[#d4a037]">{item.creator}</strong></span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {item.metadata?.Duration && (
                    <>
                      <span>•</span>
                      <span>⏱ {item.metadata.Duration}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Spreaker Publishing Config */}
            {isPodcast && item.status === 'pending' && (
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
                <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <span className="text-xl">🔊</span>
                  Spreaker Publishing Settings
                </h3>

                <div className="mb-6 p-4 bg-[#0d0d1a] rounded-lg">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input type="radio" name="showType" checked={!spreakerConfig.isNewShow}
                        onChange={() => updateSpreakerConfig('isNewShow', false)} className="text-[#d4a037]" />
                      <span className="font-medium">Add to Existing Show</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input type="radio" name="showType" checked={spreakerConfig.isNewShow}
                        onChange={() => updateSpreakerConfig('isNewShow', true)} className="text-[#d4a037]" />
                      <span className="font-medium">Create New Show</span>
                    </label>
                  </div>
                </div>

                {!spreakerConfig.isNewShow && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Show</label>
                    <select value={spreakerConfig.showId || ''}
                      onChange={(e) => updateSpreakerConfig('showId', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a3e] text-gray-200 rounded-lg focus:ring-2 focus:ring-[#d4a037]">
                      <option value="">-- Select a show --</option>
                      {spreakerData.shows.map(show => (
                        <option key={show.id} value={show.id}>{show.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-300">Episode Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Episode Title</label>
                    <input type="text" value={spreakerConfig.title}
                      onChange={(e) => updateSpreakerConfig('title', e.target.value)}
                      placeholder={item.title}
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a3e] text-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Episode Description</label>
                    <textarea value={spreakerConfig.description}
                      onChange={(e) => updateSpreakerConfig('description', e.target.value)}
                      placeholder={item.description} rows={3}
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a3e] text-gray-200 rounded-lg resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma-separated)</label>
                    <input type="text" value={spreakerConfig.tags}
                      onChange={(e) => updateSpreakerConfig('tags', e.target.value)}
                      placeholder="crime, true crime, legal"
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2a2a3e] text-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Case Metadata</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-gray-500">{key}</dt>
                      <dd className="font-medium text-gray-300">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Channel Selection */}
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
              <h3 className="font-semibold text-gray-200 mb-4">Publish to Channels</h3>
              <div className="space-y-2">
                {channelOptions.map((ch) => (
                  <label key={ch.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChannels.includes(ch.id)
                        ? 'bg-[#d4a037]/10 border-[#d4a037]/40'
                        : 'bg-[#0d0d1a] border-[#2a2a3e] hover:bg-[#2a2a3e]'
                    }`}>
                    <input type="checkbox" checked={selectedChannels.includes(ch.id)}
                      onChange={() => toggleChannel(ch.id)}
                      className="h-4 w-4 text-[#d4a037] rounded border-gray-600"
                      disabled={item.status !== 'pending'} />
                    <span className="text-xl">{ch.icon}</span>
                    <span className="font-medium text-gray-300">{ch.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
              <h3 className="font-semibold text-gray-200 mb-4">
                {item.status === 'pending' ? 'Feedback (optional)' : 'Feedback'}
              </h3>
              {item.status === 'pending' ? (
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add notes or feedback..."
                  className="w-full h-24 px-3 py-2 bg-[#0d0d1a] border border-[#2a2a3e] text-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#d4a037] focus:border-transparent" />
              ) : (
                <p className="text-gray-400">{item.feedback || 'No feedback provided.'}</p>
              )}
            </div>

            {/* Action Buttons */}
            {item.status === 'pending' && (
              <div className="flex gap-3">
                <button onClick={() => handleAction('reject')} disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {submitting ? '...' : '✕ Reject'}
                </button>
                <button onClick={() => handleAction('approve')} disabled={submitting || selectedChannels.length === 0}
                  className="flex-1 px-4 py-3 bg-[#d4a037] text-[#1a1a2e] rounded-lg font-bold hover:bg-[#e4b047] disabled:opacity-50 transition-colors">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Publishing...
                    </span>
                  ) : '✓ Approve & Publish'}
                </button>
              </div>
            )}

            {item.status !== 'pending' && (
              <div className={`p-4 rounded-lg border ${statusColors[item.status]}`}>
                <p className="font-medium">
                  {item.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                </p>
                {item.status === 'approved' && item.channels.length > 0 && (
                  <p className="text-sm mt-1">Published to: {item.channels.join(', ')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
