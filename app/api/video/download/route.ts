import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { loadServerVideos } from '@/lib/video-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, userId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const serverVideos = loadServerVideos();
    const video = serverVideos.find((v) => v.id === videoId) || INITIAL_SEED_VIDEOS.find((v) => v.id === videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate signed download link
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const downloadTicket = crypto
      .createHmac('sha256', process.env.SECURE_VIDEO_SIGNING_KEY || 'decent_donghua_video_access_jwt_salt')
      .update(`download:${videoId}:${userId || 'guest'}:${expiresAt}`)
      .digest('hex');

    const rawStreamUrl = video.videoUrl || video.videoStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const temporaryDownloadUrl = rawStreamUrl.includes('?')
      ? `${rawStreamUrl}&ticket=${downloadTicket}`
      : `${rawStreamUrl}?ticket=${downloadTicket}`;

    return NextResponse.json({
      allowed: true,
      ticket: downloadTicket,
      expiresAt: new Date(expiresAt).toISOString(),
      downloadUrl: temporaryDownloadUrl,
      fileName: `DecentAnimation_${(video.donghuaName || 'Donghua').replace(/[^a-zA-Z0-9]/g, '_')}_EP${video.episodeNumber || 1}.mp4`,
      format: '1080p MP4',
      drmEncrypted: false,
      notice: 'Free offline download generated.',
    });
  } catch (error: any) {
    console.error('Download ticket generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
