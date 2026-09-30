import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isDesignatedAdmin } from '@/lib/admin-config';
import { LiveStreamItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = req.headers.get('x-admin-email') || searchParams.get('adminEmail') || '';

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let lives: LiveStreamItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'liveStreams'));
      snap.forEach((d) => {
        lives.push({ ...(d.data() as LiveStreamItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore live streams error:', e);
    }

    return NextResponse.json({ success: true, liveStreams: lives });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, liveId, title, description, streamUrl, thumbnailUrl, accessLevel, startTime, adminEmail } = body;

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    if (action === 'CREATE') {
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

      const newLiveId = `live_${Date.now()}`;
      const newLive: LiveStreamItem = {
        id: newLiveId,
        liveId: newLiveId,
        title: title.trim(),
        description: description || '',
        streamUrl: streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&auto=format&fit=crop&q=80',
        accessLevel: accessLevel || 'free',
        status: 'scheduled',
        startTime: startTime || new Date(Date.now() + 3600 * 1000).toISOString(),
        viewerCount: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'liveStreams', newLiveId), newLive);

      // Create notification for all users
      try {
        const notifId = `notif_live_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: 'all',
          title: `🔴 Live Stream Scheduled: ${title}`,
          message: `Join the upcoming live cultivation broadcast! Starting at ${new Date(newLive.startTime).toLocaleTimeString()}`,
          type: 'live_stream',
          linkUrl: `/live/${newLiveId}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Live notification notice:', e);
      }

      return NextResponse.json({ success: true, liveStream: newLive });
    } else if (action === 'START_LIVE') {
      if (!liveId) return NextResponse.json({ error: 'liveId is required' }, { status: 400 });
      await updateDoc(doc(db, 'liveStreams', liveId), {
        status: 'live',
        viewerCount: 250,
      });
      return NextResponse.json({ success: true, message: 'Stream is now LIVE!' });
    } else if (action === 'END_LIVE') {
      if (!liveId) return NextResponse.json({ error: 'liveId is required' }, { status: 400 });
      await updateDoc(doc(db, 'liveStreams', liveId), {
        status: 'ended',
        endedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, message: 'Stream has been ended.' });
    } else if (action === 'DELETE') {
      if (!liveId) return NextResponse.json({ error: 'liveId is required' }, { status: 400 });
      await deleteDoc(doc(db, 'liveStreams', liveId));
      return NextResponse.json({ success: true, message: 'Live stream deleted.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin live POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
