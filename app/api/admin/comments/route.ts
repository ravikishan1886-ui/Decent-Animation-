import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isDesignatedAdmin } from '@/lib/admin-config';
import { CommentItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = req.headers.get('x-admin-email') || searchParams.get('adminEmail') || '';

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    let comments: CommentItem[] = [];

    try {
      const snap = await getDocs(collection(db, 'comments'));
      snap.forEach((d) => {
        comments.push({ ...(d.data() as CommentItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore comments fetch notice:', e);
    }

    if (comments.length === 0) {
      comments = [
        {
          id: 'cmt_vip_1',
          userId: 'usr_sword_immortal',
          username: 'Sword Immortal Li',
          videoId: 'btth-s5-ep1',
          text: 'Xiao Yan breaking through the Dou Huang realm in this Hindi Dub is unbelievable! The audio mixing and punch SFX are crisp 🔥',
          createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          userPlan: 'vip',
          badge: '👑 VIP Cultivator',
          isPinned: true,
          isHighlighted: true,
          likesCount: 38,
          status: 'active',
        },
        {
          id: 'cmt_prem_2',
          userId: 'usr_cloud_sage',
          username: 'Cloud Sage Chen',
          videoId: 'btth-s5-ep1',
          text: 'The 1080p bitrate is so smooth on my screen. Can we please get the next episode early as well?',
          createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
          userPlan: 'premium',
          badge: '⭐ Premium Cultivator',
          isPinned: false,
          isHighlighted: false,
          likesCount: 14,
          status: 'active',
        },
      ];
    }

    // Sort newest first
    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, comments, total: comments.length });
  } catch (err: any) {
    console.error('Admin comments GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, commentId, userId, adminEmail } = body;

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    if (!commentId && action !== 'BAN_USER') {
      return NextResponse.json({ error: 'commentId is required.' }, { status: 400 });
    }

    const commentRef = commentId ? doc(db, 'comments', commentId) : null;

    if (action === 'PIN') {
      if (commentRef) await updateDoc(commentRef, { isPinned: true });
    } else if (action === 'UNPIN') {
      if (commentRef) await updateDoc(commentRef, { isPinned: false });
    } else if (action === 'HIGHLIGHT') {
      if (commentRef) await updateDoc(commentRef, { isHighlighted: true });
    } else if (action === 'UNHIGHLIGHT') {
      if (commentRef) await updateDoc(commentRef, { isHighlighted: false });
    } else if (action === 'HIDE') {
      if (commentRef) await updateDoc(commentRef, { status: 'hidden' });
    } else if (action === 'RESTORE') {
      if (commentRef) await updateDoc(commentRef, { status: 'active' });
    } else if (action === 'DELETE') {
      if (commentRef) await deleteDoc(commentRef);
    } else if (action === 'BAN_USER') {
      if (userId) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { commentingBanned: true }, { merge: true });
      }
    }

    return NextResponse.json({ success: true, message: `Action ${action} executed successfully.` });
  } catch (err: any) {
    console.error('Admin comments POST error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
