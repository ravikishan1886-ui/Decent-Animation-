import { RequiredPlan, UserProfile, VideoItem, PollItem, LiveStreamItem } from './types';
import { isDesignatedAdmin } from './admin-auth';

export interface UserEntitlements {
  plan: RequiredPlan;
  isSubscribed: boolean;
  isExpired: boolean;
  isAdmin: boolean;
  canWatchFree: boolean;
  canWatchBasic: boolean;
  canWatchPremium: boolean;
  canWatchVip: boolean;
  canDownload: boolean;
  canRemoveAds: boolean;
  canAccessExclusive: boolean;
  canAccessVip: boolean;
  canComment: boolean;
  canVote: boolean;
  canAccessLive: boolean;
  badge: string;
  vipGlow: boolean;
}

export function isUserAdmin(profile?: Partial<UserProfile> | null, email?: string | null): boolean {
  if (email && isDesignatedAdmin(email)) return true;
  if (profile?.email && isDesignatedAdmin(profile.email)) return true;
  return profile?.role === 'admin';
}

export function getUserPlan(profile?: Partial<UserProfile> | null): RequiredPlan {
  return 'free';
}

export function getUserEntitlements(profile?: Partial<UserProfile> | null, email?: string | null): UserEntitlements {
  const admin = isUserAdmin(profile, email);

  return {
    plan: 'free',
    isSubscribed: true,
    isExpired: false,
    isAdmin: admin,
    canWatchFree: true,
    canWatchBasic: true,
    canWatchPremium: true,
    canWatchVip: true,
    canDownload: true,
    canRemoveAds: true,
    canAccessExclusive: true,
    canAccessVip: true,
    canComment: Boolean(profile?.uid && !profile.commentingBanned),
    canVote: Boolean(profile?.uid),
    canAccessLive: true,
    badge: admin ? 'ADMIN' : 'CULTIVATOR',
    vipGlow: admin,
  };
}

export function canUserAccessVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): { allowed: boolean; reason?: string; requiredTier?: RequiredPlan } {
  return { allowed: true };
}

export function canUserWatchVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): boolean {
  return true;
}

export function canUserDownloadVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

export function canUserComment(
  profile: Partial<UserProfile> | null | undefined,
  video?: Partial<VideoItem>
): { allowed: boolean; reason?: string } {
  if (!profile || !profile.uid) {
    return {
      allowed: false,
      reason: 'Please sign in to join the conversation.',
    };
  }
  if (profile.commentingBanned) {
    return {
      allowed: false,
      reason: 'Your commenting privileges are temporarily suspended by moderation.',
    };
  }
  return { allowed: true };
}

export function canUserVoteInPoll(
  profile: Partial<UserProfile> | null | undefined,
  poll: Partial<PollItem>
): { allowed: boolean; reason?: string } {
  if (!profile || !profile.uid) {
    return { allowed: false, reason: 'Sign in to vote in community polls.' };
  }
  if (poll.votedUserIds && poll.votedUserIds.includes(profile.uid)) {
    return { allowed: false, reason: 'You have already voted in this poll.' };
  }
  return { allowed: true };
}

export const canUserVote = canUserVoteInPoll;

export function canUserAccessLiveStream(
  profile: Partial<UserProfile> | null | undefined,
  stream: Partial<LiveStreamItem>
): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

export function getPlanUpgradeMessage(plan: RequiredPlan): {
  title: string;
  subtitle: string;
  cta: string;
} {
  return {
    title: '100% Free Streaming Sanctuary',
    subtitle: 'Watch all Donghua series, 4K episodes, and high-definition reels with zero payments or subscriptions required.',
    cta: 'Browse All Episodes',
  };
}

export function getSubscriptionCountdown(expiryDate?: string | null): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  expiryString: string;
} {
  return {
    expired: false,
    days: 365,
    hours: 0,
    minutes: 0,
    seconds: 0,
    formatted: 'Lifetime 100% Free Access',
    expiryString: 'Unlimited',
  };
}
