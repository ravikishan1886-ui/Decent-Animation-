import { NextRequest, NextResponse } from 'next/server';
import { checkVideoAccess } from '@/lib/security';
import { fetchVideoById } from '@/lib/video-service';
import { VideoItem } from '@/lib/types';

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

    // Retrieve video metadata from Realtime Database (with Firestore / Seed fallback)
    const video: VideoItem | null = await fetchVideoById(videoId);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const accessType = video.accessType || 'subscription';

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
          requiredPlan: video.requiredPlan,
        },
        { status: 403 }
      );
    }

    // Authorized: return AVCaption responsive embed URL
    const rawPlaybackUrl = video.embedUrl || video.avcaptionUrl || video.videoStreamUrl || video.videoUrl || '';

    return NextResponse.json({
      allowed: true,
      playbackUrl: rawPlaybackUrl,
      embedUrl: video.embedUrl || video.avcaptionUrl || rawPlaybackUrl,
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

  const video = await fetchVideoById(videoId);
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json({
    videoId,
    title: video.title,
    seriesName: video.seriesName || video.donghuaName,
    episodeNumber: video.episodeNumber,
    accessType: video.accessType,
    requiredPlan: video.requiredPlan,
    isFree: video.accessType === 'free',
    hasEmbedUrl: Boolean(video.embedUrl || video.avcaptionUrl),
  });
}
