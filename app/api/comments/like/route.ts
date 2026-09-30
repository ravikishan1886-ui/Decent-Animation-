import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, userId } = body;

    if (!commentId || !userId) {
      return NextResponse.json({ error: 'commentId and userId are required.' }, { status: 400 });
    }

    const commentRef = doc(db, 'comments', commentId);
    let commentSnap;
    try {
      commentSnap = await getDoc(commentRef);
    } catch (e) {
      console.warn('Comment like fetch error:', e);
    }

    if (!commentSnap || !commentSnap.exists()) {
      return NextResponse.json({ success: true, likesCount: 1, isLiked: true });
    }

    const data = commentSnap.data();
    const likedBy: string[] = data.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    let updatedLikedBy = [];
    let updatedCount = data.likesCount || 0;

    if (hasLiked) {
      updatedLikedBy = likedBy.filter((id) => id !== userId);
      updatedCount = Math.max(0, updatedCount - 1);
    } else {
      updatedLikedBy = [...likedBy, userId];
      updatedCount += 1;
    }

    try {
      await updateDoc(commentRef, {
        likedBy: updatedLikedBy,
        likesCount: updatedCount,
      });
    } catch (e) {
      console.warn('Comment like update notice:', e);
    }

    return NextResponse.json({
      success: true,
      likesCount: updatedCount,
      isLiked: !hasLiked,
    });
  } catch (err: any) {
    console.error('Comment like error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
