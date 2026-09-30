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
  if (!profile) return 'free';
  if (isUserAdmin(profile)) return 'vip';

  // Check expiration if subscription status is active
  if (profile.subscriptionStatus === 'active' && profile.subscriptionExpiry) {
    const expiryTime = new Date(profile.subscriptionExpiry).getTime();
    if (Date.now() > expiryTime) {
      return 'free';
    }
    const planId = (profile.planId || profile.currentPlan || '').toLowerCase();
    if (planId.includes('vip')) return 'vip';
    if (planId.includes('premium')) return 'premium';
    if (planId.includes('basic')) return 'basic';
    return 'basic';
  }

  return 'free';
}

export function getUserEntitlements(profile?: Partial<UserProfile> | null, email?: string | null): UserEntitlements {
  const admin = isUserAdmin(profile, email);
  const plan = admin ? 'vip' : getUserPlan(profile);
  const isSubscribed = admin || plan !== 'free';

  const isExpired = Boolean(
    !admin &&
    profile?.subscriptionStatus === 'active' &&
    profile?.subscriptionExpiry &&
    Date.now() > new Date(profile.subscriptionExpiry).getTime()
  );

  let badge = 'Free Cultivator';
  if (admin) badge = '🛡️ Grand Administrator';
  else if (plan === 'vip') badge = '👑 VIP Cultivator';
  else if (plan === 'premium') badge = '⭐ Premium Cultivator';
  else if (plan === 'basic') badge = '🗡️ Basic Cultivator';

  return {
    plan,
    isSubscribed,
    isExpired,
    isAdmin: admin,
    canWatchFree: true,
    canWatchBasic: admin || plan === 'basic' || plan === 'premium' || plan === 'vip',
    canWatchPremium: admin || plan === 'premium' || plan === 'vip',
    canWatchVip: admin || plan === 'vip',
    canDownload: admin || plan === 'premium' || plan === 'vip',
    canRemoveAds: admin || plan === 'premium' || plan === 'vip',
    canAccessExclusive: admin || plan === 'premium' || plan === 'vip',
    canAccessVip: admin || plan === 'vip',
    canComment: Boolean(profile?.uid && !profile.commentingBanned),
    canVote: Boolean(profile?.uid),
    canAccessLive: true,
    badge,
    vipGlow: plan === 'vip' || admin,
  };
}

export function canUserAccessVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): { allowed: boolean; reason?: string; requiredTier?: RequiredPlan } {
  if (!video) return { allowed: false, reason: 'Video not found' };
  if (isUserAdmin(profile)) return { allowed: true };

  const accessType = video.accessType || 'free';
  const requiredPlan = video.requiredPlan || 'free';

  // If video is free tier or accessType is free
  if (accessType === 'free' || requiredPlan === 'free') {
    return { allowed: true };
  }

  const userPlan = getUserPlan(profile);

  if (userPlan === 'free') {
    return {
      allowed: false,
      reason: 'This Donghua episode requires an active subscription.',
      requiredTier: requiredPlan === 'vip' || accessType === 'vip' ? 'vip' : requiredPlan === 'premium' || accessType === 'exclusive' ? 'premium' : 'basic',
    };
  }

  if (accessType === 'vip' || requiredPlan === 'vip') {
    if (userPlan === 'vip') return { allowed: true };
    return {
      allowed: false,
      reason: 'This special release is exclusively unlocked for VIP Yearly members.',
      requiredTier: 'vip',
    };
  }

  if (accessType === 'exclusive' || requiredPlan === 'premium') {
    if (userPlan === 'premium' || userPlan === 'vip') return { allowed: true };
    return {
      allowed: false,
      reason: 'This exclusive saga requires Premium or VIP membership.',
      requiredTier: 'premium',
    };
  }

  if (accessType === 'subscription' || requiredPlan === 'basic') {
    if (userPlan === 'basic' || userPlan === 'premium' || userPlan === 'vip') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Subscription required to view this episode.',
      requiredTier: 'basic',
    };
  }

  return { allowed: true };
}

export function canUserWatchVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): boolean {
  return canUserAccessVideo(profile, video).allowed;
}

export function canUserDownloadVideo(
  profile: Partial<UserProfile> | null | undefined,
  video: Partial<VideoItem>
): { allowed: boolean; reason?: string } {
  if (isUserAdmin(profile)) return { allowed: true };
  const userPlan = getUserPlan(profile);

  if (userPlan !== 'premium' && userPlan !== 'vip') {
    return {
      allowed: false,
      reason: 'Offline downloads are enabled for Premium and VIP members only.',
    };
  }

  if (video.downloadAllowed === false) {
    return {
      allowed: false,
      reason: 'Publisher rights holder has disabled offline downloads for this title.',
    };
  }

  return { allowed: true };
}

export function canUserComment(
  profile: Partial<UserProfile> | null | undefined,
  video?: Partial<VideoItem>
): { allowed: boolean; reason?: string } {
  if (!profile?.uid) {
    return { allowed: false, reason: 'You must be logged in to comment.' };
  }

  if (profile.commentingBanned) {
    return {
      allowed: false,
      reason: 'Your commenting privilege has been restricted by platform moderators.',
    };
  }

  if (video) {
    const watchCheck = canUserAccessVideo(profile, video);
    if (!watchCheck.allowed) {
      return {
        allowed: false,
        reason: 'You must have access to this video to comment.',
      };
    }
  }

  return { allowed: true };
}

export function canUserVote(
  profile: Partial<UserProfile> | null | undefined,
  poll: Partial<PollItem>
): { allowed: boolean; reason?: string } {
  if (!profile?.uid) {
    return { allowed: false, reason: 'Please sign in to cast your vote in this poll.' };
  }

  if (poll.status !== 'active') {
    return { allowed: false, reason: 'This poll has ended or is not active.' };
  }

  const userPlan = getUserPlan(profile);
  const allowed = poll.allowedPlans || 'all';

  if (allowed === 'vip' && userPlan !== 'vip' && !isUserAdmin(profile)) {
    return { allowed: false, reason: 'This community poll is restricted to VIP members.' };
  }

  if (allowed === 'premium+' && userPlan !== 'premium' && userPlan !== 'vip' && !isUserAdmin(profile)) {
    return { allowed: false, reason: 'This poll is restricted to Premium & VIP members.' };
  }

  if (allowed === 'basic+' && userPlan === 'free' && !isUserAdmin(profile)) {
    return { allowed: false, reason: 'Active subscription required to vote in this poll.' };
  }

  return { allowed: true };
}

export function canUserAccessLive(
  profile: Partial<UserProfile> | null | undefined,
  liveStream: Partial<LiveStreamItem>
): { allowed: boolean; reason?: string } {
  if (isUserAdmin(profile)) return { allowed: true };

  const access = liveStream.accessLevel || 'public';
  if (access === 'public' || access === 'free') return { allowed: true };

  if (!profile?.uid) {
    return { allowed: false, reason: 'Please sign in to access this live broadcast.' };
  }

  const userPlan = getUserPlan(profile);

  if (access === 'vip' && userPlan !== 'vip') {
    return { allowed: false, reason: 'This live event is exclusively for VIP members.' };
  }

  if (access === 'premium' && userPlan !== 'premium' && userPlan !== 'vip') {
    return { allowed: false, reason: 'This live event requires Premium or VIP membership.' };
  }

  if (access === 'basic' && userPlan === 'free') {
    return { allowed: false, reason: 'Active subscription required to join this live broadcast.' };
  }

  return { allowed: true };
}

export function getPlanUpgradeMessage(plan: RequiredPlan): { title: string; subtitle: string; cta: string } {
  switch (plan) {
    case 'free':
      return {
        title: 'Upgrade to Premium to Unlock Exclusive Donghua',
        subtitle: 'Get full HD 1080p streaming, offline downloads, and ad-free cultivation sagas.',
        cta: 'Explore Plans (From ₹59)',
      };
    case 'basic':
      return {
        title: 'Upgrade to Premium to Unlock Downloads & Exclusive Sagas',
        subtitle: 'Enjoy 100% ad-free streaming, offline episode downloads, and VIP community badges.',
        cta: 'Upgrade to Premium (₹99)',
      };
    case 'premium':
      return {
        title: 'Upgrade to VIP to Unlock the Complete VIP Experience',
        subtitle: 'Receive 4K UltraHD 60fps streaming, early weekly release access, and the Gold VIP Badge 👑.',
        cta: 'Upgrade to VIP (₹999/yr)',
      };
    case 'vip':
      return {
        title: 'Welcome back, VIP Cultivator Member 👑',
        subtitle: 'You have unrestricted access to all high-bitrate master Donghua episodes and VIP community perks.',
        cta: 'VIP Portal Active',
      };
  }
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
  if (!expiryDate) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'No active subscription',
      expiryString: 'None',
    };
  }

  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();
  const diff = expiry - now;

  if (diff <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Your subscription has expired',
      expiryString: new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let formatted = '';
  if (days > 0) {
    formatted = `${days} days ${hours} hours ${minutes} minutes remaining`;
  } else if (hours > 0) {
    formatted = `${hours} hours ${minutes} minutes ${seconds} seconds remaining`;
  } else {
    formatted = `${minutes} minutes ${seconds} seconds remaining`;
  }

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    formatted,
    expiryString: new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}
