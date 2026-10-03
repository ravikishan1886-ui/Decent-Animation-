import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoById } from '@/lib/video-service';
import { loadServerVideos } from '@/lib/video-store';
import { VideoItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { videoId, userId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Retrieve video metadata from server store or Firebase
    const serverVideos = loadServerVideos();
    let video: VideoItem | null = serverVideos.find((v) => v.id === videoId) || null;
    if (!video) {
      video = await fetchVideoById(videoId);
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // All videos are 100% free and accessible to all viewers
    const isFirebaseSource =
      video.videoSource === 'firebase' ||
      Boolean(video.videoStoragePath) ||
      Boolean(video.videoUrl && (video.videoUrl.includes('firebasestorage.googleapis.com') || video.videoUrl.startsWith('/api/media/') || video.videoUrl.startsWith('/uploads/')));

    const rawPlaybackUrl = isFirebaseSource
      ? (video.videoUrl || video.videoStreamUrl || video.embedUrl || video.avcaptionUrl || '')
      : (video.embedUrl || video.avcaptionUrl || video.videoUrl || video.videoStreamUrl || '');

    return NextResponse.json({
      allowed: true,
      playbackUrl: rawPlaybackUrl,
      videoUrl: video.videoUrl || rawPlaybackUrl,
      embedUrl: video.embedUrl || rawPlaybackUrl,
      videoSource: isFirebaseSource ? 'firebase' : 'external',
      quality: '1080p FHD / Master Dub',
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
    accessType: 'free',
    requiredPlan: 'free',
    allowed: true,
  });
}
