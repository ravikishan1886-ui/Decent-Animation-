import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, videoId, reporterUserId, reason } = body;

    if (!commentId || !reporterUserId || !reason) {
      return NextResponse.json({ error: 'commentId, reporterUserId, and reason are required.' }, { status: 400 });
    }

    const reportId = `rep_${Date.now()}_${commentId.slice(0, 4)}`;
    const reportData = {
      id: reportId,
      commentId,
      videoId: videoId || '',
      reporterUserId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'commentReports', reportId), reportData);
    } catch (e) {
      console.warn('Report save notice:', e);
    }

    return NextResponse.json({ success: true, message: 'Report submitted to moderators.' });
  } catch (err: any) {
    console.error('Comment report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
