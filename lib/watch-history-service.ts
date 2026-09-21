/**
 * Decent Animation - User Watch History & Continue Watching Engine
 * Tracks user playback timestamps, progress percentages, and completion status
 * Uses deterministic document IDs: `${userId}_${videoId}`
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { WatchHistoryItem, VideoItem } from './types';
import { getAllCatalogVideos } from './search-service';

export function getWatchHistoryDocId(userId: string, videoId: string): string {
  return `${userId}_${videoId}`;
}

/**
 * Record or update watch progress in Firestore & local cache
 */
export async function recordWatchProgress(data: {
  userId: string;
  videoId: string;
  progressSeconds: number;
  durationSeconds: number;
}): Promise<WatchHistoryItem> {
  const { userId, videoId, progressSeconds, durationSeconds } = data;
  const historyId = getWatchHistoryDocId(userId, videoId);
  const now = new Date().toISOString();

  const duration = Math.max(1, Math.round(durationSeconds || 1));
  const progress = Math.min(duration, Math.max(0, Math.round(progressSeconds || 0)));
  const progressPercent = Math.min(100, Math.round((progress / duration) * 100));
  const completed = progressPercent >= 92;

  const historyRecord: WatchHistoryItem = {
    id: historyId,
    userId,
    videoId,
    progress,
    progressPercent,
    duration,
    completed,
    lastWatchedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'watchHistory', historyId);
    // Merge to preserve original createdAt if it exists
    await setDoc(
      docRef,
      {
        id: historyId,
        userId,
        videoId,
        progress,
        progressPercent,
        duration,
        completed,
        lastWatchedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore watch history write notice:', err);
  }

  // Also sync to subcollection for user-specific path rules
  try {
    const subDocRef = doc(db, 'users', userId, 'watchHistory', videoId);
    await setDoc(
      subDocRef,
      {
        videoId,
        progress,
        progressPercent,
        duration,
        completed,
        lastWatchedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    // Non-blocking
  }

  return historyRecord;
}

/**
 * Retrieve progress for a specific video
 */
export async function getVideoWatchProgress(
  userId: string,
  videoId: string
): Promise<WatchHistoryItem | null> {
  try {
    const historyId = getWatchHistoryDocId(userId, videoId);
    const docSnap = await getDoc(doc(db, 'watchHistory', historyId));
    if (docSnap.exists()) {
      return docSnap.data() as WatchHistoryItem;
    }
  } catch (err) {
    console.warn('Failed to retrieve video progress:', err);
  }
  return null;
}

/**
 * Fetch all watch history for a user, sorted by lastWatchedAt desc and hydrated with video details
 */
export async function getUserWatchHistory(
  userId: string,
  maxItems: number = 20
): Promise<WatchHistoryItem[]> {
  try {
    const allVideos = await getAllCatalogVideos();
    const videoMap = new Map<string, VideoItem>();
    allVideos.forEach((v) => videoMap.set(v.id, v));

    const historyRef = collection(db, 'watchHistory');
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('lastWatchedAt', 'desc'),
      firestoreLimit(maxItems)
    );

    const snap = await getDocs(q);
    const results: WatchHistoryItem[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as WatchHistoryItem;
      const video = videoMap.get(data.videoId);
      results.push({
        ...data,
        video: video || {
          id: data.videoId,
          title: 'Donghua Episode',
          donghuaName: 'Celestial Realm',
          description: 'Cultivation streaming episode',
          thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          videoStoragePath: '',
          accessType: 'free',
          requiredPlan: 'basic',
          duration: `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}`,
          category: 'Cultivation',
          genre: 'Action',
          language: 'Hindi Dub',
          subtitles: 'English',
          tags: ['Cultivation'],
          published: true,
          views: 100,
          likes: 10,
          createdAt: data.lastWatchedAt,
          episodeNumber: 1,
          seasonNumber: 1,
        },
      });
    });

    return results;
  } catch (err) {
    console.warn('Failed to fetch user watch history from Firestore:', err);
    return [];
  }
}

/**
 * Delete a single watch history entry
 */
export async function removeWatchHistoryEntry(userId: string, videoId: string): Promise<boolean> {
  try {
    const historyId = getWatchHistoryDocId(userId, videoId);
    await deleteDoc(doc(db, 'watchHistory', historyId));
    try {
      await deleteDoc(doc(db, 'users', userId, 'watchHistory', videoId));
    } catch (e) {
      // Ignored
    }
    return true;
  } catch (err) {
    console.error('Error deleting watch history item:', err);
    return false;
  }
}
