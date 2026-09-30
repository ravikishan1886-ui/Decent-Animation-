import { NextRequest, NextResponse } from 'next/server';
import { fetchAllVideosFromFirebase, fetchVideoById, groupVideosBySeries } from '@/lib/video-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id') || searchParams.get('videoId');
    const seriesId = searchParams.get('seriesId');
    const groupSeries = searchParams.get('groupSeries') === 'true';

    // If single video requested
    if (videoId) {
      const video = await fetchVideoById(videoId);
      if (!video) {
        return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, video });
    }

    let allVideos = await fetchAllVideosFromFirebase();
    // Only published videos for user-facing API
    allVideos = allVideos.filter((v) => v.published !== false && v.status !== 'draft');

    if (seriesId) {
      allVideos = allVideos.filter((v) => v.seriesId === seriesId || (v.seriesName || v.donghuaName || '').toLowerCase() === seriesId.toLowerCase());
      // Sort episodes numerically
      allVideos.sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
    }

    if (groupSeries) {
      const grouped = groupVideosBySeries(allVideos);
      return NextResponse.json({ success: true, series: grouped, totalVideos: allVideos.length });
    }

    return NextResponse.json({ success: true, videos: allVideos, total: allVideos.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
