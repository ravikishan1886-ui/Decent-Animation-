import { NextRequest, NextResponse } from 'next/server';
import { isDesignatedAdmin, verifyAdminAccess } from '@/lib/admin-auth';
import {
  fetchAllVideosFromFirebase,
  saveVideoToFirebase,
  updateVideoInFirebase,
  deleteVideoFromFirebase,
  validateVideoUrl,
  normalizeVideoItem,
} from '@/lib/video-service';
import {
  loadServerVideos,
  saveServerVideo,
  updateServerVideo,
  deleteServerVideo,
} from '@/lib/video-store';
import { VideoItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'free', 'subscription', 'premium', 'vip', 'published', 'draft'
    const search = searchParams.get('search')?.toLowerCase();
    const contentType = searchParams.get('contentType');
    const series = searchParams.get('series')?.toLowerCase();

    // 1. Load from server-side persistent store (highest authority for custom uploaded videos)
    const serverVideos = loadServerVideos();

    // 2. Load from Firebase / Seed
    const fbVideos = await fetchAllVideosFromFirebase();

    const videoMap = new Map<string, VideoItem>();
    fbVideos.forEach((v) => videoMap.set(v.id, v));
    serverVideos.forEach((v) => videoMap.set(v.id, normalizeVideoItem(v, v.id)));

    let list: VideoItem[] = Array.from(videoMap.values());

    // Apply filter
    if (filter && filter !== 'all') {
      if (filter === 'draft') {
        list = list.filter((v) => v.status === 'draft' || v.published === false);
      } else if (filter === 'published') {
        list = list.filter((v) => v.status === 'published' || (v.published === true && v.status !== 'draft'));
      } else {
        list = list.filter((v) => v.accessType === filter || v.requiredPlan === filter);
      }
    }

    if (contentType && contentType !== 'all') {
      list = list.filter((v) => v.contentType === contentType || v.videoType === contentType);
    }

    if (series) {
      list = list.filter((v) => (v.seriesName || v.donghuaName || '').toLowerCase().includes(series));
    }

    if (search) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          (v.seriesName || v.donghuaName || '').toLowerCase().includes(search) ||
          v.genre.toLowerCase().includes(search) ||
          String(v.episodeNumber).includes(search)
      );
    }

    // Sort numerically by episode number within series or by newest creation date
    list.sort((a, b) => {
      if (a.seriesName && b.seriesName && a.seriesName.toLowerCase() === b.seriesName.toLowerCase()) {
        return (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json({ success: true, videos: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoData } = body;
    const cleanAdminEmail = (adminEmail || req.headers.get('x-admin-email') || '').toLowerCase().trim();

    if (!verifyAdminAccess(cleanAdminEmail, adminRole) && !isDesignatedAdmin(cleanAdminEmail)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoData) {
      return NextResponse.json({ success: false, error: 'Video payload missing.' }, { status: 400 });
    }

    const seriesName = (videoData.seriesName || videoData.donghuaName || '').trim();
    if (!seriesName) {
      return NextResponse.json({ success: false, error: 'Series name is required.' }, { status: 400 });
    }

    const title = (videoData.title || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Video title is required.' }, { status: 400 });
    }

    const rawUrl = (videoData.videoUrl || videoData.embedUrl || videoData.avcaptionUrl || videoData.videoStreamUrl || '').trim();
    const validation = validateVideoUrl(rawUrl);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Save to Firebase
    const result = await saveVideoToFirebase(
      {
        ...videoData,
        seriesName,
        donghuaName: seriesName,
        title,
        videoUrl: rawUrl,
        videoStreamUrl: rawUrl,
        embedUrl: videoData.embedUrl || rawUrl,
        avcaptionUrl: videoData.embedUrl || rawUrl,
      },
      cleanAdminEmail
    );

    if (!result.success || !result.video) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to save video.' }, { status: 500 });
    }

    // Also persist permanently to server store
    await saveServerVideo(result.video);

    return NextResponse.json({
      success: true,
      video: result.video,
      message: result.video?.status === 'draft' ? 'Draft saved successfully' : 'Video published successfully to Firebase',
    });
  } catch (error: any) {
    console.error('Admin POST video error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoId, updates } = body;
    const cleanAdminEmail = (adminEmail || req.headers.get('x-admin-email') || '').toLowerCase().trim();

    if (!verifyAdminAccess(cleanAdminEmail, adminRole) && !isDesignatedAdmin(cleanAdminEmail)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoId || !updates) {
      return NextResponse.json({ success: false, error: 'Video ID and updates are required' }, { status: 400 });
    }

    if (updates.videoUrl || updates.embedUrl) {
      const targetUrl = (updates.videoUrl || updates.embedUrl || '').trim();
      const validation = validateVideoUrl(targetUrl);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    // Update in Firebase
    const result = await updateVideoInFirebase(videoId, updates, cleanAdminEmail);

    // Update in server store
    await updateServerVideo(videoId, updates);

    return NextResponse.json({
      success: true,
      video: result.video,
      message: 'Video updated successfully in Firebase',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoId, storagePath, thumbnailPath } = body;
    const cleanAdminEmail = (adminEmail || req.headers.get('x-admin-email') || '').toLowerCase().trim();

    if (!verifyAdminAccess(cleanAdminEmail, adminRole) && !isDesignatedAdmin(cleanAdminEmail)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Video ID is required' }, { status: 400 });
    }

    // Delete from Firebase
    await deleteVideoFromFirebase(videoId, storagePath, thumbnailPath);

    // Delete from server store
    await deleteServerVideo(videoId);

    return NextResponse.json({
      success: true,
      message: 'Video metadata and files removed from Firebase successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
