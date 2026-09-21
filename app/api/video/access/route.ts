import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkVideoAccess, generateSecureStreamUrl } from '@/lib/security';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { videoId, userPlanTier, isSubscriptionActive, isAdmin, userId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Retrieve video metadata (from seed catalog or database)
    const video = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId);
    const accessType = video ? video.accessType : 'subscription';

    // Verify access server-side
    const accessCheck = checkVideoAccess(
      accessType,
      userPlanTier || 'none',
      Boolean(isSubscriptionActive),
      Boolean(isAdmin)
    );

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          allowed: false,
          reason: accessCheck.reason,
          requiredTier: accessCheck.requiredTier,
          streamUrl: null,
        },
        { status: 403 }
      );
    }

    // Authorized: generate secure signed streaming reference
    const signedUrl = generateSecureStreamUrl(videoId, userId || 'guest');
    const rawPlaybackUrl = video?.videoStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    return NextResponse.json({
      allowed: true,
      signedUrl,
      playbackUrl: rawPlaybackUrl,
      quality: userPlanTier === 'vip' ? '4K UltraHD / 1080p 60fps' : userPlanTier === 'premium' ? '1080p FHD' : '720p HD',
      watermark: userId ? `DA-UID-${userId.slice(0, 6)}` : undefined,
    });
  } catch (error: any) {
    console.error('Video access verification error:', error);
    return NextResponse.json({ error: 'Failed to authorize video access' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId query parameter' }, { status: 400 });
  }

  const video = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId);
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json({
    videoId,
    accessType: video.accessType,
    requiredPlan: video.requiredPlan,
    isFree: video.accessType === 'free',
  });
}
