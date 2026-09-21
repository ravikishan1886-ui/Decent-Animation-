export type AccessType = 'free' | 'subscription' | 'exclusive' | 'vip';
export type RequiredPlan = 'free' | 'basic' | 'premium' | 'vip';
export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'cancelled';
export type PlanDuration = 'monthly' | 'quarterly' | 'yearly';
export type ContentType = 'series' | 'episode' | 'movie' | 'special';
export type PublishingStatus = 'draft' | 'published' | 'scheduled';
export type RightsStatusType = 'Licensed' | 'Owned' | 'Authorized' | 'Pending Verification';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  period: PlanDuration;
  durationLabel: string;
  tier: RequiredPlan;
  features: string[];
  downloadAllowed: boolean;
  adsAllowed: boolean;
  exclusiveAccess: boolean;
  highlight?: boolean;
  badge?: string;
}

export interface NotificationPreferences {
  subscriptionEmails: boolean;
  newContent: boolean;
  expiryReminders: boolean;
  promotional: boolean;
  pushNotifications: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  planId?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: string;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  normalizedTitle?: string;
  donghuaName: string;
  description: string;
  normalizedDescription?: string;
  shortDescription?: string;
  contentType?: ContentType;
  episodeNumber: number;
  seasonNumber: number;
  thumbnailUrl: string;
  posterUrl?: string;
  videoStoragePath: string; // internal storage path or reference
  videoStreamUrl?: string; // signed/proxied streaming URL or sample
  accessType: AccessType;
  requiredPlan: RequiredPlan;
  duration: string;
  durationSeconds?: number;
  category: string;
  genre: string;
  genres?: string[];
  language: string;
  audio?: string;
  subtitles: string;
  tags: string[];
  published: boolean;
  status?: PublishingStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewEpisode?: boolean;
  downloadAllowed?: boolean;
  adsAllowed?: boolean;
  views: number;
  uniqueViews?: number;
  popularityScore?: number;
  likes: number;
  rightsStatus?: string;
  licenseInfo?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  territory?: string;
  licenseExpiry?: string;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  planId: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  status: 'created' | 'verified' | 'failed';
  createdAt: string;
}

export interface WatchHistoryItem {
  id: string; // Deterministic format: userId_videoId
  userId: string;
  videoId: string;
  progress: number; // in seconds
  progressPercent: number; // 0 to 100
  duration: number; // in seconds
  lastWatchedAt: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  // Hydrated video data for rendering
  video?: VideoItem;
}

export interface NotificationLog {
  id: string;
  userId: string;
  userEmail?: string;
  type:
    | 'USER_CREATED'
    | 'SUBSCRIPTION_PURCHASED'
    | 'SUBSCRIPTION_EXPIRY_7DAYS'
    | 'SUBSCRIPTION_EXPIRY_3DAYS'
    | 'SUBSCRIPTION_EXPIRY_1DAY'
    | 'SUBSCRIPTION_EXPIRED'
    | 'PASSWORD_RESET_CONFIRMATION'
    | 'VIDEO_PUBLISHED';
  subscriptionId?: string;
  videoId?: string;
  scheduledFor?: string;
  sentAt: string;
  channel: 'email' | 'push';
  status: 'sent' | 'failed' | 'skipped';
  recipient: string;
  subject?: string;
  errorMessage?: string;
  createdAt: string;
}

export type SortOption = 'newest' | 'popular' | 'updated' | 'title_asc';

export interface SearchFilterParams {
  q?: string;
  genre?: string;
  accessType?: string;
  language?: string;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  videos: VideoItem[];
  total: number;
  page: number;
  totalPages: number;
  genres: string[];
  accessTypes: string[];
  hasMore: boolean;
}

export const DONGHUA_GENRES = [
  'All',
  'Action',
  'Fantasy',
  'Cultivation',
  'Adventure',
  'Martial Arts',
  'Xianxia',
  'Romance',
  'Drama',
  'Comedy',
  'Mystery',
  'Sci-Fi',
  'Historical',
  'Reincarnation',
] as const;

export const DONGHUA_ACCESS_TYPES = [
  'All',
  'Free',
  'Premium',
  'Exclusive',
  'VIP',
] as const;

export const DONGHUA_LANGUAGES = [
  'All',
  'Hindi Dubbed',
  'Chinese',
  'English',
  'Hindi Subtitles',
  'Multiple Audio',
] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  subscriptionEmails: true,
  newContent: true,
  expiryReminders: true,
  promotional: false,
  pushNotifications: true,
};

export interface WatchProgress {
  userId: string;
  videoId: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Monthly',
    price: 59,
    period: 'monthly',
    durationLabel: '/ month',
    tier: 'basic',
    features: [
      'Watch subscription content',
      'Standard HD quality',
      'Hindi & English subtitles',
      'Ads may be shown',
    ],
    downloadAllowed: false,
    adsAllowed: true,
    exclusiveAccess: false,
  },
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    price: 99,
    period: 'monthly',
    durationLabel: '/ month',
    tier: 'premium',
    features: [
      'Watch subscription content',
      'Exclusive content access',
      'Download feature enabled',
      'Full HD 1080p streaming',
      'Premium badge in community',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    highlight: true,
    badge: 'Popular',
  },
  {
    id: 'basic-quarterly',
    name: 'Basic Quarterly',
    price: 160,
    period: 'quarterly',
    durationLabel: '/ 3 months',
    tier: 'basic',
    features: [
      'Watch subscription content for 3 months',
      'Save ₹17 vs monthly basic',
      'Standard HD quality',
      'Ads may be shown',
    ],
    downloadAllowed: false,
    adsAllowed: true,
    exclusiveAccess: false,
  },
  {
    id: 'premium-quarterly',
    name: 'Premium Quarterly',
    price: 459,
    period: 'quarterly',
    durationLabel: '/ 3 months',
    tier: 'premium',
    features: [
      'Premium content for 3 months',
      'Exclusive content included',
      'Download feature enabled',
      'High speed streaming server',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: 599,
    period: 'yearly',
    durationLabel: '/ year',
    tier: 'premium',
    features: [
      'Full 12 months premium access',
      'Exclusive Donghua catalogue',
      'Offline downloads permitted',
      'High bit-rate 4K & 1080p streaming',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    badge: 'Best Value',
  },
  {
    id: 'vip-yearly',
    name: 'VIP Yearly',
    price: 999,
    period: 'yearly',
    durationLabel: '/ year',
    tier: 'vip',
    features: [
      'All premium & VIP exclusive content',
      'Highest priority download access',
      '100% Ad-free streaming',
      'VIP Cultivator Gold badge',
      'Early access to weekly releases',
      'All exclusive features included',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    highlight: true,
    badge: 'Ultimate VIP',
  },
];
