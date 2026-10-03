import { NextRequest, NextResponse } from 'next/server';
import { readReelsFromStore, writeReelsToStore } from '@/lib/reel-store';
import { ReelItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';

    let reels = readReelsFromStore();

    if (status !== 'all') {
      reels = reels.filter((r) => r.status === status || (!r.status && status === 'published'));
    }

    return NextResponse.json({ reels });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list reels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.videoUrl) {
      return NextResponse.json({ error: 'Title and Video URL are required' }, { status: 400 });
    }

    const reels = readReelsFromStore();
    const newReel: ReelItem = {
      id: body.id || `reel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl || '',
      title: body.title,
      description: body.description || '',
      creatorId: body.creatorId || 'admin',
      creatorName: body.creatorName || 'Decent Animation',
      seriesId: body.seriesId || '',
      seriesName: body.seriesName || '',
      episodeId: body.episodeId || '',
      episodeNumber: body.episodeNumber || '',
      hashtags: Array.isArray(body.hashtags)
        ? body.hashtags
        : typeof body.hashtags === 'string'
        ? body.hashtags.split(' ').filter(Boolean)
        : [],
      accessType: body.accessType || 'free',
      status: body.status || 'published',
      publishedAt: body.publishedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      views: body.views || 0,
      likesCount: body.likesCount || 0,
      commentsCount: body.commentsCount || 0,
      sharesCount: body.sharesCount || 0,
      savesCount: body.savesCount || 0,
    };

    reels.unshift(newReel);
    writeReelsToStore(reels);

    return NextResponse.json({ success: true, reel: newReel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create reel' }, { status: 500 });
  }
}
