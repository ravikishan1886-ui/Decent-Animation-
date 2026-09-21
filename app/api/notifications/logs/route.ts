import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const maxLimit = parseInt(searchParams.get('limit') || '50', 10);

    const logsRef = collection(db, 'notificationLogs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error('Fetch notification logs error:', error);
    // Fallback empty list gracefully
    return NextResponse.json({ success: true, count: 0, logs: [] });
  }
}
