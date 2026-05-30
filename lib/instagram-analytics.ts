/**
 * Instagram Analytics for IPAI personality accounts
 * 
 * Currently uses hardcoded data from Meta Business Suite exports.
 * When Instagram Graph API credentials are available, this will
 * switch to live API calls.
 */

export interface InstagramAccount {
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

export interface InstagramPerformance {
  views: { value: number; change_pct: number };
  reach: { value: number; change_pct: number };
  interactions: { value: number; change_pct: number };
  from_followers: { value: number; change_pct: number };
  period: string;
}

export interface InstagramAnalytics {
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

/**
 * Static data sourced from Meta Business Suite (Feb 15, 2026)
 * This serves as fallback until Instagram Graph API is configured.
 */
const STATIC_ACCOUNTS: InstagramAccount[] = [
  {
    handle: '@inceptionpointai',
    name: 'Inception Point AI',
    role: 'Main brand account',
    avatar_emoji: '🏢',
    avatar_url: 'https://www.inceptionpoint.ai/wp-content/uploads/2025/08/cropped-Inception-Point-Logo-FINAL-RGB-250x83.png',
    followers: 80,
    views_28d: 144,
    reach_28d: 22,
    interactions_28d: 10,
    is_main: true,
  },
  {
    handle: '@nigelthistledown',
    name: 'Nigel Thistledown',
    role: 'Garden Expert 🌱',
    avatar_emoji: '🌱',
    avatar_url: 'https://www.inceptionpoint.ai/wp-content/uploads/2025/08/Nigel_Thistledown_gardening_Blk_1_250.png',
    followers: null,
    views_28d: null,
    reach_28d: null,
    interactions_28d: null,
  },
  {
    handle: '@claredelish',
    name: 'Claire Delish',
    role: 'Personal Chef 👩‍🍳',
    avatar_emoji: '👩‍🍳',
    avatar_url: 'https://www.inceptionpoint.ai/wp-content/uploads/2025/08/Claire_Delish_-Home_Cook_1_250.png',
    followers: null,
    views_28d: null,
    reach_28d: null,
  },
  {
    handle: '@olybennet',
    name: 'Oly Bennett',
    role: 'Fitness Coach 💪',
    avatar_emoji: '💪',
    avatar_url: 'https://www.inceptionpoint.ai/wp-content/uploads/2025/08/Oly_Bennet_-_Sports_-Blk_1_250.png',
    followers: null,
    views_28d: null,
    reach_28d: null,
  },
  {
    handle: '@roxierushipai',
    name: 'Roxie Rush',
    role: 'Entertainment 🎬',
    avatar_emoji: '🎬',
    followers: null,
    views_28d: null,
    reach_28d: null,
  },
  {
    handle: '@marcuselleryipai',
    name: 'Marcus Ellery',
    role: 'Personality',
    avatar_emoji: '👤',
    followers: null,
    views_28d: null,
    reach_28d: null,
  },
  {
    handle: '@vanessaclarkipai',
    name: 'Vanessa Clark',
    role: 'Personality',
    avatar_emoji: '👤',
    followers: null,
    views_28d: null,
    reach_28d: null,
  },
];

const STATIC_PERFORMANCE: InstagramPerformance = {
  views: { value: 144, change_pct: -51.8 },
  reach: { value: 22, change_pct: 57.1 },
  interactions: { value: 10, change_pct: 100 },
  from_followers: { value: 17, change_pct: 750 },
  period: 'Jan 18 – Feb 14, 2026',
};

/**
 * Get Instagram analytics data.
 * Currently returns static data; will use Graph API when credentials are set.
 */
export async function getInstagramAnalytics(): Promise<InstagramAnalytics> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  // If API credentials exist, attempt live fetch
  if (accessToken && businessAccountId) {
    try {
      return await fetchLiveInstagramData(accessToken, businessAccountId);
    } catch (error) {
      console.error('Instagram API failed, falling back to static data:', error);
    }
  }

  // Fallback: static data
  const totalFollowers = STATIC_ACCOUNTS
    .reduce((sum, a) => sum + (a.followers || 0), 0);
  const totalViews = STATIC_ACCOUNTS
    .reduce((sum, a) => sum + (a.views_28d || 0), 0);
  const totalReach = STATIC_ACCOUNTS
    .reduce((sum, a) => sum + (a.reach_28d || 0), 0);

  return {
    data_source: 'Meta Business Suite (static export)',
    last_updated: '2026-02-15T19:45:00-08:00',
    total_accounts: STATIC_ACCOUNTS.length,
    total_followers: totalFollowers,
    total_views_28d: totalViews,
    total_reach_28d: totalReach,
    accounts: STATIC_ACCOUNTS,
    main_account_performance: STATIC_PERFORMANCE,
    api_connected: false,
  };
}

/**
 * Placeholder for live Instagram Graph API integration
 */
async function fetchLiveInstagramData(
  accessToken: string,
  businessAccountId: string,
): Promise<InstagramAnalytics> {
  const baseUrl = 'https://graph.facebook.com/v21.0';

  // Fetch basic account info
  const res = await fetch(
    `${baseUrl}/${businessAccountId}?fields=followers_count,media_count,username,name&access_token=${accessToken}`,
  );

  if (!res.ok) {
    throw new Error(`Instagram API error: ${res.status}`);
  }

  const accountData = await res.json();

  // Build a minimal response from live data
  const liveAccount: InstagramAccount = {
    handle: `@${accountData.username}`,
    name: accountData.name || accountData.username,
    role: 'Main brand account',
    avatar_emoji: '🏢',
    followers: accountData.followers_count || 0,
    views_28d: null,
    reach_28d: null,
    is_main: true,
  };

  // Merge live main account with static personality data
  const accounts = [
    liveAccount,
    ...STATIC_ACCOUNTS.filter((a) => !a.is_main),
  ];

  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0);

  return {
    data_source: 'Instagram Graph API',
    last_updated: new Date().toISOString(),
    total_accounts: accounts.length,
    total_followers: totalFollowers,
    total_views_28d: 0,
    total_reach_28d: 0,
    accounts,
    main_account_performance: null,
    api_connected: true,
  };
}
