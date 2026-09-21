import crypto from 'crypto';
import { PlanConfig, SUBSCRIPTION_PLANS } from './types';

// Verification helper for Razorpay payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secretKey: string
): boolean {
  if (!secretKey || secretKey === 'placeholderSecretKeyForVerification') {
    // If running in development sandbox with test mock fallback
    return Boolean(signature && orderId && paymentId);
  }
  try {
    const generated = crypto
      .createHmac('sha256', secretKey)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return false;
  }
}

// Check if user has permission to watch a video based on subscription tier
export function checkVideoAccess(
  videoAccessType: 'free' | 'subscription' | 'exclusive' | 'vip',
  userPlanTier: 'none' | 'basic' | 'premium' | 'vip',
  isSubscriptionActive: boolean,
  isAdmin: boolean = false
): { hasAccess: boolean; reason?: string; requiredTier?: string } {
  if (isAdmin) {
    return { hasAccess: true };
  }

  if (videoAccessType === 'free') {
    return { hasAccess: true };
  }

  if (!isSubscriptionActive || userPlanTier === 'none') {
    return {
      hasAccess: false,
      reason: 'Active subscription required',
      requiredTier: videoAccessType === 'vip' ? 'vip' : videoAccessType === 'exclusive' ? 'premium' : 'basic',
    };
  }

  if (videoAccessType === 'subscription') {
    // basic, premium, vip can watch
    return { hasAccess: true };
  }

  if (videoAccessType === 'exclusive') {
    // premium or vip can watch
    if (userPlanTier === 'premium' || userPlanTier === 'vip') {
      return { hasAccess: true };
    }
    return {
      hasAccess: false,
      reason: 'Requires Premium or VIP plan to watch this exclusive episode',
      requiredTier: 'premium',
    };
  }

  if (videoAccessType === 'vip') {
    if (userPlanTier === 'vip') {
      return { hasAccess: true };
    }
    return {
      hasAccess: false,
      reason: 'Requires VIP Yearly membership for early-access VIP episodes',
      requiredTier: 'vip',
    };
  }

  return { hasAccess: false, reason: 'Unauthorized' };
}

export const DESIGNATED_ADMIN_EMAILS = [
  'videocinema80@gmail.com',
  'ranveerkrsingh165@gmail.com',
];

export function isDesignatedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return DESIGNATED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function verifyAdminAccess(email?: string | null, role?: string | null): boolean {
  if (!email) return false;
  return isDesignatedAdminEmail(email) || role === 'admin';
}

// Generate time-limited secure signed video streaming URL
export function generateSecureStreamUrl(videoId: string, userId: string, accessKey: string = 'salt'): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 4; // 4 hours token
  const token = crypto
    .createHmac('sha256', process.env.SECURE_VIDEO_SIGNING_KEY || accessKey)
    .update(`${videoId}:${userId}:${expiresAt}`)
    .digest('hex');

  return `/api/video/stream?videoId=${encodeURIComponent(videoId)}&expires=${expiresAt}&token=${token}`;
}
