import { ref, get, set, update, remove, onValue } from 'firebase/database';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import { VideoItem, AccessType, RequiredPlan, ContentType, PublishingStatus } from './types';
import { INITIAL_SEED_VIDEOS } from './seed-data';
import { deleteStorageFile } from './storage-service';

export interface SeriesGroup {
  seriesId: string;
  seriesName: string;
  thumbnailUrl: string;
  genre: string;
  episodesCount: number;
  episodes: VideoItem[];
  latestEpisode?: VideoItem;
}

/**
 * Creates a URL/key-safe series slug
 */
export function slugifySeries(name: string): string {
  return (
    (name || 'uncategorized')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'series'
  );
}

/**
 * Validates a video stream URL or AVCaption embed URL
 */
export function validateVideoUrl(url?: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'A valid video file URL or embed URL is required.' };
  }
  const clean = url.trim();
  if (
    !clean.startsWith('http://') &&
    !clean.startsWith('https://') &&
    !clean.startsWith('/') &&
    !clean.startsWith('//')
  ) {
    return { valid: false, error: 'Video URL must begin with https://, http://, or /api/media' };
  }
  return { valid: true };
}

export const validateAvCaptionEmbedUrl = validateVideoUrl;

/**
 * Normalizes a raw video record into a typed VideoItem
 */
export function normalizeVideoItem(raw: any, fallbackId?: string): VideoItem {
  const id = raw.id || raw.videoId || fallbackId || `vid_${Date.now()}`;
  const seriesName = (
    raw.seriesName ||
    raw.donghuaName ||
    raw.series ||
    'Decent Animation Series'
  ).trim();
  const seriesId = raw.seriesId || slugifySeries(seriesName);
  const title = (raw.title || `${seriesName} Episode ${raw.episodeNumber || 1}`).trim();

  const rawVideoUrl = (raw.videoUrl || raw.videoStreamUrl || '').trim();
  const rawEmbedUrl = (raw.embedUrl || raw.avcaptionUrl || '').trim();

  // Distinguish between direct storage / local uploaded video and external embed sources
  const isUploadedVideo = Boolean(
    raw.videoStoragePath ||
      rawVideoUrl.includes('/api/media/') ||
      rawVideoUrl.includes('/uploads/') ||
      rawVideoUrl.includes('firebasestorage.googleapis.com') ||
      raw.videoSource === 'firebase' ||
      raw.videoSource === 'upload'
  );

  const videoSource: 'firebase' | 'external' =
    raw.videoSource || (isUploadedVideo ? 'firebase' : rawEmbedUrl ? 'external' : 'firebase');

  const videoUrl = rawVideoUrl || rawEmbedUrl;
  const embedUrl = rawEmbedUrl || rawVideoUrl;
  const accessType: AccessType = 'free';
  const requiredPlan: RequiredPlan | string = 'free';
  const episodeNumber = Math.max(1, Number(raw.episodeNumber) || 1);
  const seasonNumber = Math.max(1, Number(raw.seasonNumber) || 1);
  const published = raw.published !== undefined ? Boolean(raw.published) : raw.status !== 'draft';
  const status: PublishingStatus = raw.status || (published ? 'published' : 'draft');

  return {
    id,
    title,
    donghuaName: seriesName,
    seriesName,
    seriesId,
    description: raw.description || `${seriesName} - Episode ${episodeNumber}`,
    shortDescription: raw.shortDescription || '',
    contentType: (raw.contentType as ContentType) || (raw.videoType as ContentType) || 'episode',
    videoType: (raw.videoType as any) || (raw.contentType as any) || 'episode',
    episodeNumber,
    seasonNumber,
    thumbnailUrl:
      raw.thumbnailUrl ||
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
    posterUrl: raw.posterUrl || raw.thumbnailUrl,
    videoSource,
    embedUrl,
    videoUrl,
    avcaptionUrl: embedUrl,
    videoStreamUrl: videoUrl,
    videoStoragePath: raw.videoStoragePath || undefined,
    thumbnailStoragePath: raw.thumbnailStoragePath || undefined,
    fileName: raw.fileName || undefined,
    fileSize: raw.fileSize || undefined,
    accessType,
    requiredPlan,
    duration: raw.duration || '22:30',
    category: raw.genre || raw.category || 'Cultivation',
    genre: raw.genre || raw.category || 'Cultivation',
    genres:
      Array.isArray(raw.genres) && raw.genres.length > 0
        ? raw.genres
        : [raw.genre || 'Cultivation'],
    language: raw.language || 'Hindi Dubbed',
    audio: raw.audio || raw.language || 'Hindi Dubbed',
    subtitles: raw.subtitles || 'Hindi, English',
    tags: Array.isArray(raw.tags) ? raw.tags : [seriesName, raw.genre || 'Cultivation'],
    published,
    status,
    releaseDate:
      raw.releaseDate ||
      (raw.createdAt ? String(raw.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]),
    createdBy: raw.createdBy || 'admin',
    uploadedBy: raw.uploadedBy || raw.createdBy || 'admin',
    views: Number(raw.views) || 0,
    likes: Number(raw.likes) || 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    adsAllowed: raw.adsAllowed !== false,
    downloadAllowed: raw.downloadAllowed !== false,
    earlyAccess: Boolean(raw.earlyAccess || raw.isNewEpisode),
    exclusive: Boolean(raw.exclusive || raw.accessType === 'exclusive'),
  };
}

/**
 * Saves a video record to Firebase Realtime Database and Cloud Firestore
 */
export async function saveVideoToFirebase(
  videoInput: Partial<VideoItem>,
  adminEmail: string
): Promise<{ success: boolean; video?: VideoItem; error?: string }> {
  try {
    const rawTargetUrl = (
      videoInput.videoUrl ||
      videoInput.embedUrl ||
      videoInput.avcaptionUrl ||
      videoInput.videoStreamUrl ||
      ''
    ).trim();

    const urlValidation = validateVideoUrl(rawTargetUrl);
    if (!urlValidation.valid) {
      return { success: false, error: urlValidation.error };
    }

    const seriesName = (videoInput.seriesName || videoInput.donghuaName || '').trim();
    if (!seriesName) {
      return { success: false, error: 'Series name is required.' };
    }

    const title = (videoInput.title || '').trim();
    if (!title) {
      return { success: false, error: 'Video title is required.' };
    }

    const videoId =
      videoInput.id || `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const normalized = normalizeVideoItem(
      {
        ...videoInput,
        id: videoId,
        seriesName,
        donghuaName: seriesName,
        seriesId: videoInput.seriesId || slugifySeries(seriesName),
        title,
        videoUrl: rawTargetUrl,
        videoStreamUrl: rawTargetUrl,
        embedUrl: (videoInput.embedUrl || rawTargetUrl).trim(),
        avcaptionUrl: (videoInput.embedUrl || rawTargetUrl).trim(),
        createdBy: adminEmail || 'admin',
        uploadedBy: adminEmail || 'admin',
        createdAt: videoInput.createdAt || nowIso,
        updatedAt: nowIso,
      },
      videoId
    );

    // Save to Firebase Realtime Database at /videos/{videoId}
    if (rtdb) {
      try {
        const videoRef = ref(rtdb, `videos/${videoId}`);
        await set(videoRef, normalized);
      } catch (rtdbErr: any) {
        console.warn('Realtime Database write notice:', rtdbErr?.message || rtdbErr);
      }
    }

    // Mirror to Cloud Firestore
    try {
      await setDoc(doc(db, 'videos', videoId), normalized, { merge: true });
    } catch (fsErr: any) {
      console.warn('Firestore write notice:', fsErr?.message || fsErr);
    }

    return { success: true, video: normalized };
  } catch (err: any) {
    console.error('Error saving video to Firebase:', err);
    return { success: false, error: err?.message || 'Failed to save video to database' };
  }
}

/**
 * Updates a video record in Firebase Realtime Database and Firestore
 */
export async function updateVideoInFirebase(
  videoId: string,
  updates: Partial<VideoItem>,
  adminEmail: string
): Promise<{ success: boolean; video?: VideoItem; error?: string }> {
  try {
    if (!videoId) return { success: false, error: 'Video ID is required.' };

    const nowIso = new Date().toISOString();
    const cleanUpdates: Record<string, any> = {
      ...updates,
      updatedAt: nowIso,
      updatedBy: adminEmail || 'admin',
    };

    if (updates.seriesName) {
      cleanUpdates.donghuaName = updates.seriesName;
      if (!updates.seriesId) {
        cleanUpdates.seriesId = slugifySeries(updates.seriesName);
      }
    }
    if (updates.embedUrl) {
      cleanUpdates.avcaptionUrl = updates.embedUrl;
    }
    if (updates.videoUrl) {
      cleanUpdates.videoStreamUrl = updates.videoUrl;
    }

    // Update in RTDB
    if (rtdb) {
      try {
        const videoRef = ref(rtdb, `videos/${videoId}`);
        await update(videoRef, cleanUpdates);
      } catch (e: any) {
        console.warn('RTDB update notice:', e?.message || e);
      }
    }

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'videos', videoId), cleanUpdates);
    } catch (e: any) {
      console.warn('Firestore update notice:', e?.message || e);
    }

    const updated = await fetchVideoById(videoId);
    return { success: true, video: updated || undefined };
  } catch (err: any) {
    console.error('Error updating video in Firebase:', err);
    return { success: false, error: err?.message || 'Failed to update video' };
  }
}

/**
 * Deletes a video record from Firebase Realtime Database and Firestore
 */
export async function deleteVideoFromFirebase(
  videoId: string,
  storagePath?: string,
  thumbnailPath?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!videoId) return { success: false, error: 'Video ID is required.' };

    const existing = await fetchVideoById(videoId);
    const vPath = storagePath || existing?.videoStoragePath;
    const tPath = thumbnailPath || existing?.thumbnailStoragePath;

    // Remove from RTDB
    if (rtdb) {
      try {
        await remove(ref(rtdb, `videos/${videoId}`));
      } catch (e: any) {
        console.warn('RTDB remove notice:', e?.message || e);
      }
    }

    // Remove from Firestore
    try {
      await deleteDoc(doc(db, 'videos', videoId));
    } catch (e: any) {
      console.warn('Firestore remove notice:', e?.message || e);
    }

    // Delete from Storage if applicable
    if (vPath) await deleteStorageFile(vPath);
    if (tPath) await deleteStorageFile(tPath);

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting video:', err);
    return { success: false, error: err?.message || 'Failed to delete video record' };
  }
}

/**
 * Fetches a single video by ID
 */
export async function fetchVideoById(videoId: string): Promise<VideoItem | null> {
  if (!videoId) return null;

  // 1. Try Realtime Database
  if (rtdb) {
    try {
      const snap = await get(ref(rtdb, `videos/${videoId}`));
      if (snap.exists()) {
        return normalizeVideoItem(snap.val(), videoId);
      }
    } catch (e) {
      // Non-blocking fallback
    }
  }

  // 2. Try Firestore
  try {
    const snap = await getDoc(doc(db, 'videos', videoId));
    if (snap.exists()) {
      return normalizeVideoItem(snap.data(), videoId);
    }
  } catch (e) {
    // Non-blocking fallback
  }

  // 3. Fallback to Seed Catalog
  const seed = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId);
  return seed ? normalizeVideoItem(seed, videoId) : null;
}

/**
 * Fetches all videos from database and API
 */
export async function fetchAllVideosFromFirebase(): Promise<VideoItem[]> {
  const videoMap = new Map<string, VideoItem>();

  // 1. Seed data as initial baseline
  INITIAL_SEED_VIDEOS.forEach((v) => {
    videoMap.set(v.id, normalizeVideoItem(v, v.id));
  });

  // 2. In browser environment, fetch from API to get all server-stored custom videos
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos)) {
          data.videos.forEach((v: VideoItem) => {
            const norm = normalizeVideoItem(v, v.id);
            videoMap.set(norm.id, norm);
          });
          return Array.from(videoMap.values());
        }
      }
    } catch (e) {
      console.warn('API video fetch fallback to direct database:', e);
    }
  }

  // 3. Fetch from Realtime Database
  if (rtdb) {
    try {
      const snap = await get(ref(rtdb, 'videos'));
      if (snap.exists()) {
        const val = snap.val();
        Object.keys(val).forEach((key) => {
          const item = val[key];
          if (item) {
            const normalized = normalizeVideoItem(item, key);
            videoMap.set(normalized.id, normalized);
          }
        });
      }
    } catch (e: any) {
      console.warn('Realtime Database fetch all notice:', e?.message || e);
    }
  }

  // 4. Merge from Firestore
  try {
    const fsSnap = await getDocs(collection(db, 'videos'));
    fsSnap.forEach((d) => {
      const item = d.data();
      const normalized = normalizeVideoItem(item, d.id);
      videoMap.set(normalized.id, normalized);
    });
  } catch (e: any) {
    console.warn('Firestore fetch all notice:', e?.message || e);
  }

  return Array.from(videoMap.values());
}

/**
 * Groups videos by Series and sorts episodes strictly numerically
 */
export function groupVideosBySeries(videos: VideoItem[]): SeriesGroup[] {
  const seriesMap = new Map<string, SeriesGroup>();

  videos.forEach((video) => {
    const seriesName = (video.seriesName || video.donghuaName || 'Decent Animation').trim();
    const seriesId = video.seriesId || slugifySeries(seriesName);

    if (!seriesMap.has(seriesId)) {
      seriesMap.set(seriesId, {
        seriesId,
        seriesName,
        thumbnailUrl: video.thumbnailUrl,
        genre: video.genre || video.category || 'Cultivation',
        episodesCount: 0,
        episodes: [],
      });
    }

    const group = seriesMap.get(seriesId)!;
    group.episodes.push(video);
  });

  // Numerical sorting for episodes (1, 2, 3 ... 10, 11)
  return Array.from(seriesMap.values()).map((group) => {
    group.episodes.sort((a, b) => {
      const epA = Number(a.episodeNumber) || 0;
      const epB = Number(b.episodeNumber) || 0;
      if (epA !== epB) return epA - epB;
      const sA = Number(a.seasonNumber) || 0;
      const sB = Number(b.seasonNumber) || 0;
      return sA - sB;
    });

    group.episodesCount = group.episodes.length;
    group.latestEpisode = group.episodes[group.episodes.length - 1];
    return group;
  });
}

/**
 * Real-time updates subscription for client-side listeners
 */
export function subscribeToFirebaseVideos(
  onUpdate: (videos: VideoItem[]) => void,
  onlyPublished: boolean = true
): () => void {
  fetchAllVideosFromFirebase().then((list) => {
    const filtered = onlyPublished ? list.filter((v) => v.published !== false && v.status !== 'draft') : list;
    onUpdate(filtered);
  });

  if (!rtdb) return () => {};

  try {
    const videosRef = ref(rtdb, 'videos');
    const unsubscribe = onValue(
      videosRef,
      (snapshot) => {
        const videoMap = new Map<string, VideoItem>();

        INITIAL_SEED_VIDEOS.forEach((v) => videoMap.set(v.id, normalizeVideoItem(v, v.id)));

        if (snapshot.exists()) {
          const val = snapshot.val();
          Object.keys(val).forEach((k) => {
            if (val[k]) {
              const norm = normalizeVideoItem(val[k], k);
              videoMap.set(norm.id, norm);
            }
          });
        }

        let all = Array.from(videoMap.values());
        if (onlyPublished) {
          all = all.filter((v) => v.published !== false && v.status !== 'draft');
        }

        onUpdate(all);
      },
      (error) => {
        console.warn('Realtime Database listener notice:', error?.message || error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.warn('Could not attach RTDB listener:', err);
    return () => {};
  }
}
