export type AccessType = 'free';
export type RequiredPlan = 'free' | 'basic' | 'premium' | 'vip';
export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'active' | 'none' | 'expired' | 'cancelled';
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
  userId?: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  plan?: string;
  currentPlan?: string;
  planId?: string;
  planStartDate?: string | null;
  planExpiryDate?: string | null;
  lastLogin?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  paymentSource?: string;
  superChatTotal?: number;
  badges?: string[];
  showOnLeaderboard?: boolean;
  commentingBanned?: boolean;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface CommentItem {
  id: string;
  userId: string;
  username: string;
  profileImage?: string;
  videoId: string;
  text: string;
  content?: string;
  createdAt: string;
  updatedAt?: string;
  userPlan: RequiredPlan;
  badge?: string;
  isPinned: boolean;
  isHighlighted: boolean;
  isSuperChat?: boolean;
  superChatAmount?: number;
  likesCount: number;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  parentId?: string | null;
  replyToUsername?: string;
  status: 'active' | 'hidden' | 'reported';
  reportReason?: string;
}

export interface CommentReport {
  id: string;
  commentId: string;
  videoId: string;
  reporterUserId: string;
  reporterEmail?: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollItem {
  id: string;
  pollId: string;
  question: string;
  description?: string;
  options: PollOption[];
  createdAt: string;
  endAt?: string;
  status: 'active' | 'closed' | 'scheduled';
  allowedPlans: 'all' | 'logged_in' | 'basic+' | 'premium+' | 'vip';
  totalVotes: number;
  votedUserIds?: string[];
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionId: string;
  votedAt: string;
}

export interface LiveStreamItem {
  id: string;
  liveId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  streamUrl: string;
  hlsStreamUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  startTime: string;
  scheduledStartTime?: string;
  endedAt?: string;
  accessLevel: 'public' | 'free' | 'basic' | 'premium' | 'vip';
  accessTier?: 'public' | 'free' | 'basic' | 'premium' | 'vip';
  viewerCount: number;
  superChatTotal?: number;
  replayVideoId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveChatMessage {
  id: string;
  liveId: string;
  userId: string;
  username: string;
  profileImage?: string;
  message: string;
  content?: string;
  userPlan: RequiredPlan;
  badge?: string;
  isSuperChat?: boolean;
  superChatAmount?: number;
  amount?: number;
  createdAt: string;
}

export interface SuperChatItem {
  id: string;
  superChatId: string;
  userId: string;
  username: string;
  userEmail?: string;
  profileImage?: string;
  amount: number;
  message: string;
  targetId: string; // videoId or liveId
  targetType: 'video' | 'live';
  paymentId: string;
  status: 'created' | 'verified' | 'failed' | 'refunded';
  badgeLevel?: 'supporter' | 'super_supporter' | 'top_supporter';
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  content?: string;
  type?: string;
  image?: string;
  targetAudience: 'all' | 'free' | 'basic' | 'premium' | 'vip';
  publishDate: string;
  expiryDate?: string;
  linkUrl?: string;
  link?: string;
  active: boolean;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'video_release' | 'subscription' | 'poll' | 'live_stream' | 'announcement' | 'superchat' | 'system';
  linkUrl?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type NotificationItem = InAppNotification;

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profileImage?: string;
  plan: RequiredPlan;
  isVip: boolean;
  isPremium: boolean;
  superChatTotal: number;
  superChatCount?: number;
  badge: string;
  badgeLevel?: string;
  isAnonymous?: boolean;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  name: string;
  icon: string;
  awardedAt: string;
  source: string;
}

export interface ReelItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  creatorId?: string;
  creatorName?: string;
  seriesId?: string;
  seriesName?: string;
  episodeId?: string;
  episodeNumber?: number | string;
  hashtags?: string[];
  accessType?: 'free' | 'vip';
  status?: 'draft' | 'published';
  publishedAt?: string;
  createdAt?: string;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  savesCount?: number;
}

export interface ReelCommentItem {
  id: string;
  reelId: string;
  userId: string;
  username: string;
  userEmail?: string;
  profileImage?: string;
  userPlan?: RequiredPlan;
  text: string;
  likesCount?: number;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  normalizedTitle?: string;
  donghuaName: string;
  seriesId?: string;
  seriesName?: string;
  description: string;
  normalizedDescription?: string;
  shortDescription?: string;
  contentType?: ContentType;
  videoType?: 'episode' | 'movie' | 'special';
  episodeNumber: number;
  seasonNumber: number;
  thumbnailUrl: string;
  posterUrl?: string;
  videoSource?: 'firebase' | 'external';
  embedUrl?: string; // AVCaption responsive embed URL
  videoUrl?: string; // Persistent video stream URL or AVCaption direct stream URL
  avcaptionUrl?: string;
  videoStoragePath?: string; // Firebase Storage object path (e.g., videos/series/vid_123.mp4)
  thumbnailStoragePath?: string; // Firebase Storage thumbnail path
  videoStreamUrl?: string; // streaming URL
  accessType: AccessType;
  requiredPlan: RequiredPlan | string;
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
  releaseDate?: string;
  createdBy?: string;
  uploadedBy?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewEpisode?: boolean;
  downloadAllowed?: boolean;
  adsAllowed?: boolean;
  earlyAccess?: boolean;
  exclusive?: boolean;
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
  // MONTHLY PLANS
  {
    id: 'basic-monthly',
    name: 'Basic',
    price: 59,
    period: 'monthly',
    durationLabel: '/ month',
    tier: 'basic',
    features: [
      'Access to Basic subscription content',
      'Standard streaming quality',
      'Standard community comments',
      'Basic subscriber badge',
      'Ads may be displayed',
      'No video downloads',
    ],
    downloadAllowed: false,
    adsAllowed: true,
    exclusiveAccess: false,
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    price: 99,
    period: 'monthly',
    durationLabel: '/ month',
    tier: 'premium',
    features: [
      'Everything included in Basic',
      'Full Premium library access',
      '100% Ad-free streaming',
      'Download-enabled content',
      'Exclusive content & Early access',
      'Premium badge & Highlighted comments',
      'Access to Premium polls/events',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'vip-monthly',
    name: 'VIP',
    price: 149,
    period: 'monthly',
    durationLabel: '/ month',
    tier: 'vip',
    features: [
      'Everything included in Premium',
      'Gold VIP badge & VIP profile styling',
      'VIP-only content library',
      'Priority access to new releases',
      'Higher download allowance',
      'Priority customer support',
      'VIP-only polls & member benefits',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    badge: 'VIP',
  },

  // QUARTERLY PLANS (3 MONTHS)
  {
    id: 'basic-quarterly',
    name: 'Basic',
    price: 159,
    period: 'quarterly',
    durationLabel: '/ 3 months',
    tier: 'basic',
    features: [
      'Access to Basic subscription content',
      'Save ₹18 compared to monthly plan',
      'Standard streaming quality',
      'Standard community comments',
      'Basic subscriber badge',
      'Ads may be displayed',
    ],
    downloadAllowed: false,
    adsAllowed: true,
    exclusiveAccess: false,
  },
  {
    id: 'premium-quarterly',
    name: 'Premium',
    price: 269,
    period: 'quarterly',
    durationLabel: '/ 3 months',
    tier: 'premium',
    features: [
      'Everything included in Basic',
      'Save ₹28 compared to monthly plan',
      'Full Premium library access',
      '100% Ad-free streaming',
      'Download-enabled content',
      'Exclusive content & Early access',
      'Premium badge & Highlighted comments',
      'Access to Premium polls/events',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'vip-quarterly',
    name: 'VIP',
    price: 399,
    period: 'quarterly',
    durationLabel: '/ 3 months',
    tier: 'vip',
    features: [
      'Everything included in Premium',
      'Save ₹48 compared to monthly plan',
      'Gold VIP badge & VIP profile styling',
      'VIP-only content library',
      'Priority access to new releases',
      'Higher download allowance',
      'Priority customer support',
      'VIP-only polls & member benefits',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    badge: 'VIP',
  },

  // YEARLY PLANS (1 YEAR)
  {
    id: 'basic-yearly',
    name: 'Basic',
    price: 549,
    period: 'yearly',
    durationLabel: '/ year',
    tier: 'basic',
    features: [
      'Access to Basic subscription content for 1 year',
      'Save ₹159 compared to monthly plan',
      'Standard streaming quality',
      'Standard community comments',
      'Basic subscriber badge',
      'Ads may be displayed',
    ],
    downloadAllowed: false,
    adsAllowed: true,
    exclusiveAccess: false,
  },
  {
    id: 'premium-yearly',
    name: 'Premium',
    price: 899,
    period: 'yearly',
    durationLabel: '/ year',
    tier: 'premium',
    features: [
      'Everything included in Basic for 1 year',
      'Save ₹289 compared to monthly plan',
      'Full Premium library access',
      '100% Ad-free streaming',
      'Download-enabled content',
      'Exclusive content & Early access',
      'Premium badge & Highlighted comments',
      'Access to Premium polls/events',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'vip-yearly',
    name: 'VIP',
    price: 1299,
    period: 'yearly',
    durationLabel: '/ year',
    tier: 'vip',
    features: [
      'Everything included in Premium for 1 year',
      'Save ₹489 compared to monthly plan',
      'Gold VIP badge & VIP profile styling',
      'VIP-only content library',
      'Priority access to new releases',
      'Higher download allowance',
      'Priority customer support',
      'VIP-only polls & member benefits',
    ],
    downloadAllowed: true,
    adsAllowed: false,
    exclusiveAccess: true,
    badge: 'VIP',
  },
];
