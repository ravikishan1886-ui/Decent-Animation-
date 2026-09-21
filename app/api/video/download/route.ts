import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, userPlanTier, isSubscriptionActive, isAdmin, userId } = body;

    if (!videoId || !userId) {
      return NextResponse.json({ error: 'Missing videoId or userId' }, { status: 400 });
    }

    if (!isAdmin) {
      if (!isSubscriptionActive || (userPlanTier !== 'premium' && userPlanTier !== 'vip')) {
        return NextResponse.json(
          {
            allowed: false,
            error: 'Offline download is exclusively reserved for Premium and VIP members.',
          },
          { status: 403 }
        );
      }
    }

    const video = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate time-limited signed temporary download ticket valid for 15 minutes
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const downloadTicket = crypto
      .createHmac('sha256', process.env.SECURE_VIDEO_SIGNING_KEY || 'decent_donghua_video_access_jwt_salt')
      .update(`download:${videoId}:${userId}:${expiresAt}`)
      .digest('hex');

    // Secure temporary delivery link
    const temporaryDownloadUrl = `${video.videoStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}?ticket=${downloadTicket}&expires=${expiresAt}`;

    return NextResponse.json({
      allowed: true,
      ticket: downloadTicket,
      expiresAt: new Date(expiresAt).toISOString(),
      downloadUrl: temporaryDownloadUrl,
      fileName: `DecentAnimation_${video.donghuaName.replace(/[^a-zA-Z0-9]/g, '_')}_EP${video.episodeNumber}.mp4`,
      format: '1080p MP4 (Protected Container)',
      drmEncrypted: false,
      notice: 'This download link is cryptographically signed and expires in 15 minutes.',
    });
  } catch (error: any) {
    console.error('Download ticket generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
