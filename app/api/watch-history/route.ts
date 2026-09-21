import { NextRequest, NextResponse } from 'next/server';
import {
  recordWatchProgress,
  getUserWatchHistory,
  getVideoWatchProgress,
  removeWatchHistoryEntry,
} from '@/lib/watch-history-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const videoId = searchParams.get('videoId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    if (videoId) {
      const progress = await getVideoWatchProgress(userId, videoId);
      return NextResponse.json({ success: true, progress });
    }

    const history = await getUserWatchHistory(userId, limit);
    return NextResponse.json({ success: true, count: history.length, history });
  } catch (error: any) {
    console.error('Watch history GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch watch history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, progressSeconds, durationSeconds } = body;

    if (!userId || !videoId) {
      return NextResponse.json({ error: 'Missing userId or videoId' }, { status: 400 });
    }

    const record = await recordWatchProgress({
      userId,
      videoId,
      progressSeconds: Number(progressSeconds) || 0,
      durationSeconds: Number(durationSeconds) || 1,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Watch history POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record watch progress' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const videoId = searchParams.get('videoId');

    if (!userId || !videoId) {
      return NextResponse.json({ error: 'Missing userId or videoId' }, { status: 400 });
    }

    const success = await removeWatchHistoryEntry(userId, videoId);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Watch history DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove watch history' }, { status: 500 });
  }
}
