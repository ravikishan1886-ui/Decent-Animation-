import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/security';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { VideoItem } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// In-memory cache for fallback and fast serving
let dynamicVideos: VideoItem[] = [...INITIAL_SEED_VIDEOS];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'free', 'subscription', 'premium', 'vip', 'published', 'draft'
    const search = searchParams.get('search')?.toLowerCase();
    const contentType = searchParams.get('contentType');

    let list: VideoItem[] = [];

    // Try fetching from Firestore
    try {
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      if (!videosSnapshot.empty) {
        const firestoreList: VideoItem[] = [];
        videosSnapshot.forEach((d) => {
          firestoreList.push({ id: d.id, ...(d.data() as any) });
        });
        // Merge with seed data if any IDs don't exist yet
        const ids = new Set(firestoreList.map((v) => v.id));
        list = [...firestoreList, ...dynamicVideos.filter((v) => !ids.has(v.id))];
      } else {
        list = [...dynamicVideos];
      }
    } catch {
      list = [...dynamicVideos];
    }

    // Apply filter
    if (filter && filter !== 'all') {
      if (filter === 'draft') {
        list = list.filter((v) => v.status === 'draft' || v.published === false);
      } else if (filter === 'published') {
        list = list.filter((v) => v.status === 'published' || (v.published === true && v.status !== 'draft'));
      } else {
        list = list.filter((v) => v.accessType === filter);
      }
    }

    if (contentType && contentType !== 'all') {
      list = list.filter((v) => v.contentType === contentType);
    }

    if (search) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          v.donghuaName.toLowerCase().includes(search) ||
          v.genre.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, videos: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoData } = body;

    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoData || !videoData.title || !videoData.donghuaName) {
      return NextResponse.json(
        { success: false, error: 'Title and Donghua series name are required.' },
        { status: 400 }
      );
    }

    const videoId = videoData.id || `donghua-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newVideo: VideoItem = {
      id: videoId,
      title: videoData.title.trim(),
      donghuaName: videoData.donghuaName.trim(),
      description: videoData.description || '',
      shortDescription: videoData.shortDescription || '',
      contentType: videoData.contentType || 'episode',
      episodeNumber: Number(videoData.episodeNumber) || 1,
      seasonNumber: Number(videoData.seasonNumber) || 1,
      thumbnailUrl:
        videoData.thumbnailUrl ||
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
      posterUrl: videoData.posterUrl || videoData.thumbnailUrl || '',
      videoStoragePath: videoData.videoStoragePath || `videos/donghua/${videoId}.mp4`,
      videoStreamUrl:
        videoData.videoStreamUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      accessType: videoData.accessType || 'subscription',
      requiredPlan: videoData.requiredPlan || (videoData.accessType === 'vip' ? 'vip' : videoData.accessType === 'exclusive' ? 'premium' : 'basic'),
      duration: videoData.duration || '22:30',
      category: videoData.genre || 'Cultivation',
      genre: videoData.genre || 'Cultivation',
      genres: videoData.genres || [videoData.genre || 'Cultivation'],
      language: videoData.language || 'Hindi Dubbed',
      audio: videoData.audio || 'Hindi Dubbed',
      subtitles: videoData.subtitles || 'Hindi, English',
      tags: videoData.tags || [videoData.genre || 'Cultivation', videoData.donghuaName],
      published: videoData.status !== 'draft',
      status: videoData.status || 'published',
      scheduledDate: videoData.scheduledDate || '',
      scheduledTime: videoData.scheduledTime || '',
      isFeatured: Boolean(videoData.isFeatured),
      isTrending: Boolean(videoData.isTrending),
      isNewEpisode: Boolean(videoData.isNewEpisode ?? true),
      downloadAllowed: Boolean(videoData.downloadAllowed),
      adsAllowed: videoData.adsAllowed !== undefined ? Boolean(videoData.adsAllowed) : true,
      views: 0,
      likes: 0,
      rightsStatus: videoData.rightsStatus || 'Licensed SAARC Distribution',
      licenseInfo: videoData.licenseInfo || 'Decent Animation Streaming Agreement',
      licenseStartDate: videoData.licenseStartDate || new Date().toISOString().split('T')[0],
      licenseEndDate: videoData.licenseEndDate || '',
      territory: videoData.territory || 'India, South Asia',
      fileName: videoData.fileName || 'donghua_master_source.mp4',
      fileSize: videoData.fileSize || '380 MB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore if accessible
    try {
      await setDoc(doc(db, 'videos', videoId), newVideo);
    } catch (fsErr) {
      console.warn('Firestore video write fallback to memory:', fsErr);
    }

    dynamicVideos = [newVideo, ...dynamicVideos.filter((v) => v.id !== videoId)];

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: newVideo.status === 'draft' ? 'Draft saved successfully' : 'Content published successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoId, updates } = body;

    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoId || !updates) {
      return NextResponse.json({ success: false, error: 'Video ID and updates are required' }, { status: 400 });
    }

    // Update in Firestore
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Firestore video update fallback to memory:', fsErr);
    }

    // Update in memory
    dynamicVideos = dynamicVideos.map((v) => {
      if (v.id === videoId) {
        return {
          ...v,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    const updatedVideo = dynamicVideos.find((v) => v.id === videoId);

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: 'Video updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminRole, videoId } = body;

    if (!verifyAdminAccess(adminEmail, adminRole)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: You don't have permission to access the Admin Portal." },
        { status: 403 }
      );
    }

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Video ID is required' }, { status: 400 });
    }

    try {
      await deleteDoc(doc(db, 'videos', videoId));
    } catch (fsErr) {
      console.warn('Firestore video delete fallback to memory:', fsErr);
    }

    dynamicVideos = dynamicVideos.filter((v) => v.id !== videoId);

    return NextResponse.json({
      success: true,
      message: 'Video removed from catalogue',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
