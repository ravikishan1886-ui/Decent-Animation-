import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { isDesignatedAdmin } from '@/lib/admin-config';
import { AnnouncementItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = req.headers.get('x-admin-email') || searchParams.get('adminEmail') || '';

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let list: AnnouncementItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      snap.forEach((d) => {
        list.push({ ...(d.data() as AnnouncementItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore announcements fetch notice:', e);
    }

    return NextResponse.json({ success: true, announcements: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, announcementId, title, message, targetAudience, linkUrl, adminEmail } = body;

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    if (action === 'CREATE') {
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
      }

      const id = `ann_${Date.now()}`;
      const newAnn: AnnouncementItem = {
        id,
        title: title.trim(),
        message: message.trim(),
        targetAudience: targetAudience || 'all',
        publishDate: new Date().toISOString(),
        linkUrl: linkUrl || undefined,
        active: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'announcements', id), newAnn);

      // Create broadcast notification
      try {
        const notifId = `notif_ann_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: 'all',
          title: `📢 Announcement: ${title}`,
          message: message.slice(0, 150),
          type: 'announcement',
          linkUrl: linkUrl || '/',
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Announcement notification broadcast notice:', e);
      }

      return NextResponse.json({ success: true, announcement: newAnn });
    } else if (action === 'DELETE') {
      if (!announcementId) return NextResponse.json({ error: 'announcementId is required' }, { status: 400 });
      await deleteDoc(doc(db, 'announcements', announcementId));
      return NextResponse.json({ success: true, message: 'Announcement deleted.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin announcements POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
