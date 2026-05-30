'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SpreakerShow {
  show_id: number;
  title: string;
  downloads_count: number;
  plays_count: number;
  episodes_count: number;
  pct_of_total: number;
  suggested_frequency: string;
}

interface YouTubeStats {
  channel_name: string;
  subscribers: number;
  total_views: number;
  video_count: number;
}

interface YouTubeVideo {
  video_id: string;
  title: string;
  published_at: string;
  view_count?: number;
}

interface InstagramAccount {
  handle: string;
  name: string;
  role: string;
  avatar_emoji: string;
  avatar_url?: string;
  followers: number | null;
  views_28d: number | null;
  reach_28d: number | null;
  interactions_28d?: number | null;
  is_main?: boolean;
}

interface InstagramPerformance {
  views: { value: number; change_pct: number };
  reach: { value: number; change_pct: number };
  interactions: { value: number; change_pct: number };
  from_followers: { value: number; change_pct: number };
  period: string;
}

interface InstagramData {
  data_source: string;
  last_updated: string;
  total_accounts: number;
  total_followers: number;
  total_views_28d: number;
  total_reach_28d: number;
  accounts: InstagramAccount[];
  main_account_performance: InstagramPerformance | null;
  api_connected: boolean;
}

interface AnalyticsData {
  spreaker: {
    total_downloads: number;
    total_plays: number;
    total_episodes: number;
    shows: SpreakerShow[];
  };
  youtube: {
    stats: YouTubeStats | null;
    videos: YouTubeVideo[];
  };
  instagram: InstagramData;
  suggestions: string[];
}

type TabId = 'spreaker' | 'youtube' | 'instagram' | 'suggestions';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('spreaker');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/full');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a037] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const totalReach = (data?.spreaker.total_downloads || 0) 
    + (data?.youtube?.stats?.total_views || 0)
    + (data?.instagram?.total_views_28d || 0);

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#2a2a3e] border-b border-[#d4a037]/30">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-gray-400 hover:text-[#d4a037] text-sm">← Back to Portal</Link>
              <h1 className="text-2xl font-bold mt-1 text-[#d4a037]">🌱 Nigel Analytics Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">IPAI Content Performance · Podcasts · YouTube · Instagram</p>
            </div>
            {data && (
              <div className="text-right">
                <div className="text-3xl font-bold text-[#d4a037]">{totalReach.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Reach</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#1a1a2e] border-b border-[#2a2a3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {([
              { id: 'spreaker' as TabId, label: '🔊 Spreaker Podcasts', count: data?.spreaker.shows.length },
              { id: 'youtube' as TabId, label: '📺 YouTube', count: data?.youtube?.stats?.video_count },
              { id: 'instagram' as TabId, label: '📸 Instagram', count: data?.instagram?.total_accounts },
              { id: 'suggestions' as TabId, label: '💡 Show Ideas', count: data?.suggestions?.length },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#d4a037] text-[#d4a037]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-[#2a2a3e] text-gray-400 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ========== SPREAKER TAB ========== */}
        {activeTab === 'spreaker' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-[#d4a037]">{data.spreaker.total_downloads.toLocaleString()}</div>
                <div className="text-gray-500 mt-1">Total Downloads</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-blue-400">{data.spreaker.total_plays.toLocaleString()}</div>
                <div className="text-gray-500 mt-1">Total Plays</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-purple-400">{data.spreaker.total_episodes}</div>
                <div className="text-gray-500 mt-1">Total Episodes</div>
              </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden border border-[#2a2a3e]">
              <div className="px-6 py-4 border-b border-[#2a2a3e]">
                <h2 className="text-lg font-semibold text-gray-200">Shows by Performance</h2>
              </div>
              <table className="w-full">
                <thead className="bg-[#0d0d1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Show</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Downloads</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Episodes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a3e]">
                  {data.spreaker.shows.map((show, idx) => (
                    <tr key={show.show_id} className="hover:bg-[#2a2a3e]/50">
                      <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-200">{show.title}</div>
                        <div className="text-xs text-gray-600">ID: {show.show_id}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-300">{show.downloads_count.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{show.episodes_count}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-[#0d0d1a] rounded-full overflow-hidden">
                            <div className="h-full bg-[#d4a037]" style={{ width: `${Math.min(show.pct_of_total * 1.5, 100)}%` }} />
                          </div>
                          <span className="text-sm text-gray-500 w-12">{show.pct_of_total}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          show.suggested_frequency === '2x/week' 
                            ? 'bg-amber-900/50 text-amber-300'
                            : show.suggested_frequency === 'weekly'
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {show.suggested_frequency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== YOUTUBE TAB ========== */}
        {activeTab === 'youtube' && data && (
          <div className="space-y-6">
            {data.youtube?.stats ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                    <div className="text-4xl font-bold text-red-500">{data.youtube.stats.subscribers.toLocaleString()}</div>
                    <div className="text-gray-500 mt-1">Subscribers</div>
                  </div>
                  <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                    <div className="text-4xl font-bold text-red-400">{data.youtube.stats.total_views.toLocaleString()}</div>
                    <div className="text-gray-500 mt-1">Total Views</div>
                  </div>
                  <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                    <div className="text-4xl font-bold text-red-300">{data.youtube.stats.video_count}</div>
                    <div className="text-gray-500 mt-1">Videos</div>
                  </div>
                </div>

                <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
                  <h2 className="text-lg font-semibold text-gray-200 mb-2">📺 {data.youtube.stats.channel_name}</h2>
                  <p className="text-gray-500">Nigel&apos;s DIY Home &amp; Garden YouTube channel — tips, tutorials, and seasonal guides</p>
                </div>

                {data.youtube.videos.length > 0 && (
                  <div className="bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden border border-[#2a2a3e]">
                    <div className="px-6 py-4 border-b border-[#2a2a3e]">
                      <h2 className="text-lg font-semibold text-gray-200">Recent Videos</h2>
                    </div>
                    <div className="divide-y divide-[#2a2a3e]">
                      {data.youtube.videos.map((video) => (
                        <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 hover:bg-[#2a2a3e]/50">
                          <div className="flex-1">
                            <div className="font-medium text-gray-200">{video.title}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(video.published_at).toLocaleDateString()}
                              {video.view_count !== undefined && ` • ${video.view_count.toLocaleString()} views`}
                            </div>
                          </div>
                          <span className="text-gray-600">→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-12 text-center border border-[#2a2a3e]">
                <div className="text-4xl mb-4">📺</div>
                <h3 className="text-lg font-medium text-gray-200">YouTube data unavailable</h3>
                <p className="text-gray-500 mt-1">Could not fetch YouTube statistics. The YOUTUBE_API_KEY environment variable may not be set.</p>
              </div>
            )}
          </div>
        )}

        {/* ========== INSTAGRAM TAB ========== */}
        {activeTab === 'instagram' && data && (
          <div className="space-y-6">
            {/* Data source banner */}
            {data.instagram && !data.instagram.api_connected && (
              <div className="bg-[#2a2a3e] rounded-lg p-3 flex items-center gap-3 border border-[#d4a037]/20">
                <span className="text-[#d4a037]">ℹ️</span>
                <div className="text-sm text-gray-400">
                  <span className="text-gray-300 font-medium">Static data</span> — sourced from Meta Business Suite export.
                  Connect the Instagram Graph API for live updates.
                </div>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                  {data.instagram?.total_accounts || 0}
                </div>
                <div className="text-gray-500 mt-1">Accounts</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                  {data.instagram?.total_followers || 0}
                </div>
                <div className="text-gray-500 mt-1">Total Followers</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                  {data.instagram?.total_views_28d || 0}
                </div>
                <div className="text-gray-500 mt-1">28d Views</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 text-center border border-[#2a2a3e]">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                  {data.instagram?.total_reach_28d || 0}
                </div>
                <div className="text-gray-500 mt-1">28d Reach</div>
              </div>
            </div>

            {/* Performance metrics for main account */}
            {data.instagram?.main_account_performance && (
              <div className="bg-[#1a1a2e] rounded-xl shadow-lg border border-[#2a2a3e] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2a2a3e]">
                  <h2 className="text-lg font-semibold text-gray-200">📊 @inceptionpointai Performance</h2>
                  <p className="text-xs text-gray-500 mt-1">{data.instagram.main_account_performance.period}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#2a2a3e]">
                  {[
                    { label: 'Views', ...data.instagram.main_account_performance.views },
                    { label: 'Reach', ...data.instagram.main_account_performance.reach },
                    { label: 'Interactions', ...data.instagram.main_account_performance.interactions },
                    { label: 'From Followers', ...data.instagram.main_account_performance.from_followers },
                  ].map((metric) => (
                    <div key={metric.label} className="p-6 text-center">
                      <div className="text-2xl font-bold text-gray-200">{metric.value}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{metric.label}</div>
                      <div className={`text-sm mt-2 font-medium ${metric.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.change_pct >= 0 ? '↑' : '↓'} {Math.abs(metric.change_pct)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-200 mb-4">🤖 IPAI Instagram Accounts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.instagram?.accounts.map((account) => (
                  <div
                    key={account.handle}
                    className={`bg-[#1a1a2e] rounded-xl shadow-lg p-5 border transition-colors ${
                      account.is_main
                        ? 'border-[#dc2743]/30 hover:border-[#dc2743]/50'
                        : account.handle === '@nigelthistledown'
                        ? 'border-green-600/30 hover:border-green-600/50'
                        : 'border-[#2a2a3e] hover:border-[#2a2a3e]/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#2a2a3e] flex items-center justify-center text-2xl overflow-hidden border-2 border-[#dc2743]/40">
                        {account.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={account.avatar_url} alt={account.name} className="w-full h-full object-cover" />
                        ) : (
                          account.avatar_emoji
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200 text-sm">{account.handle}</div>
                        <div className="text-xs text-gray-500">{account.role}</div>
                      </div>
                      {account.handle === '@nigelthistledown' && (
                        <span className="ml-auto px-2 py-0.5 bg-green-900/40 text-green-400 text-xs rounded-full font-medium">Nigel</span>
                      )}
                      {account.is_main && (
                        <span className="ml-auto px-2 py-0.5 bg-[#dc2743]/20 text-[#dc2743] text-xs rounded-full font-medium">Main</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-200">{account.followers ?? '—'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Followers</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-200">{account.views_28d ?? '—'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Views</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-200">{account.reach_28d ?? '—'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Reach</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note about API */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">📌 Data Notes</h3>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Full data for personality accounts requires Meta Graph API setup per account</li>
                <li>• @inceptionpointai data from Meta Business Suite (last updated: {data.instagram?.last_updated ? new Date(data.instagram.last_updated).toLocaleDateString() : 'unknown'})</li>
                <li>• Set <code className="text-gray-400 bg-[#0d0d1a] px-1 rounded">INSTAGRAM_ACCESS_TOKEN</code> and <code className="text-gray-400 bg-[#0d0d1a] px-1 rounded">INSTAGRAM_BUSINESS_ACCOUNT_ID</code> env vars to enable live API</li>
              </ul>
            </div>
          </div>
        )}

        {/* ========== SUGGESTIONS TAB ========== */}
        {activeTab === 'suggestions' && data && (
          <div className="space-y-6">
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg p-6 border border-[#2a2a3e]">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">💡 New Show Ideas Based on Performance Data</h2>
              <p className="text-gray-500 mb-6">
                Show concepts generated from analyzing performance patterns, audience interests, and content gaps.
              </p>
              <div className="space-y-4">
                {data.suggestions?.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#d4a037]/10 to-transparent rounded-lg border border-[#d4a037]/20">
                    <div className="w-8 h-8 rounded-full bg-[#d4a037] text-[#1a1a2e] flex items-center justify-center font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-200">{suggestion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
