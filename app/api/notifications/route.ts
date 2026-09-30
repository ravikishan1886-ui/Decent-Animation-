import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { InAppNotification } from '@/lib/types';

let FALLBACK_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif_init_1',
    userId: 'all',
    title: '👑 Welcome to Decent Animation Donghua Hub',
    message: 'Stream all latest high-cultivation Chinese anime dubbed in authentic Hindi with English subtitles!',
    type: 'system',
    linkUrl: '/browse',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'notif_init_2',
    userId: 'all',
    title: '🔥 New Episode: Battle Through the Heavens S5 Ep 1',
    message: 'The three-year agreement arc conclusion is now available for streaming in 4K & 1080p!',
    type: 'video_release',
    linkUrl: '/watch/btth-s5-ep1',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';

    let userNotifs: InAppNotification[] = [];

    try {
      const snap = await getDocs(collection(db, 'notifications'));
      snap.forEach((d) => {
        const n = d.data() as InAppNotification;
        if (!userId || n.userId === 'all' || n.userId === userId) {
          userNotifs.push({ ...n, id: d.id });
        }
      });
    } catch (e) {
      console.warn('Firestore notifications fetch notice:', e);
    }

    if (userNotifs.length === 0) {
      userNotifs = FALLBACK_NOTIFICATIONS;
    }

    // Sort newest first
    userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = userNotifs.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications: userNotifs.slice(0, 30),
      unreadCount,
    });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, notificationId, userId } = body;

    if (action === 'MARK_READ' && notificationId) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      } catch (e) {
        console.warn('Mark read notice:', e);
      }
      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    } else if (action === 'MARK_ALL_READ' && userId) {
      try {
        const snap = await getDocs(collection(db, 'notifications'));
        const updates: Promise<any>[] = [];
        snap.forEach((d) => {
          const n = d.data();
          if (n.userId === userId || n.userId === 'all') {
            updates.push(updateDoc(doc(db, 'notifications', d.id), { read: true }).catch(() => {}));
          }
        });
        await Promise.all(updates);
      } catch (e) {
        console.warn('Mark all read notice:', e);
      }
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Notifications POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
