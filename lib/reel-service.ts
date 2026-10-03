import { ReelItem, ReelCommentItem } from './types';
import { db, rtdb } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

export async function fetchReels(statusFilter: string = 'published'): Promise<ReelItem[]> {
  try {
    const res = await fetch(`/api/reels?status=${statusFilter}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reels) && data.reels.length > 0) {
        return data.reels;
      }
    }
  } catch (err) {
    console.warn('Reels API fetch notice, trying Firestore fallback:', err);
  }

  // Firestore fallback
  try {
    const reelsRef = collection(db, 'reels');
    const q = statusFilter === 'all'
      ? query(reelsRef, orderBy('createdAt', 'desc'))
      : query(reelsRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReelItem));
    }
  } catch (firestoreErr) {
    console.warn('Firestore reels query notice:', firestoreErr);
  }

  return [];
}

export async function toggleReelLike(
  reelId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> {
  try {
    const res = await fetch(`/api/reels/${reelId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return { liked: data.liked, likesCount: data.likesCount };
    }
  } catch (e) {
    console.warn('Like API failed:', e);
  }
  return { liked: false, likesCount: 0 };
}

export async function toggleReelSave(
  reelId: string,
  userId: string
): Promise<{ saved: boolean; savesCount: number }> {
  try {
    const res = await fetch(`/api/reels/${reelId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return { saved: data.saved, savesCount: data.savesCount };
    }
  } catch (e) {
    console.warn('Save API failed:', e);
  }
  return { saved: false, savesCount: 0 };
}

export async function recordReelView(reelId: string): Promise<number> {
  try {
    const res = await fetch(`/api/reels/${reelId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.views;
    }
  } catch (e) {
    console.warn('View API notice:', e);
  }
  return 0;
}

export async function fetchReelComments(reelId: string): Promise<ReelCommentItem[]> {
  try {
    const res = await fetch(`/api/reels/${reelId}/comments`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.comments || [];
    }
  } catch (e) {
    console.warn('Fetch comments notice:', e);
  }
  return [];
}

export async function postReelComment(
  reelId: string,
  commentData: {
    userId: string;
    username: string;
    userEmail?: string;
    text: string;
    userPlan?: string;
  }
): Promise<ReelCommentItem[]> {
  try {
    const res = await fetch(`/api/reels/${reelId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.comments || [];
    }
  } catch (e) {
    console.warn('Post comment error:', e);
  }
  return [];
}

export async function saveReelAdmin(reel: Partial<ReelItem>, isEdit: boolean): Promise<ReelItem> {
  const url = isEdit && reel.id ? `/api/reels/${reel.id}` : '/api/reels';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reel),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save reel');
  }

  // Sync to Firestore doc as well
  try {
    if (data.reel && data.reel.id) {
      await setDoc(doc(db, 'reels', data.reel.id), data.reel, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore admin reel sync notice:', err);
  }

  return data.reel;
}

export async function deleteReelAdmin(reelId: string): Promise<void> {
  const res = await fetch(`/api/reels/${reelId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete reel');
  }

  try {
    await deleteDoc(doc(db, 'reels', reelId));
  } catch (e) {
    console.warn('Firestore delete reel notice:', e);
  }
}
