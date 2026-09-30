import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { AnnouncementItem } from '@/lib/types';

let MEMORY_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_vip_4k_upgrade',
    title: '✨ 4K UltraHD Master Dubs Now Available for All VIP Yearly Members',
    message: 'We have re-rendered all Battle Through the Heavens Season 5 and Soul Land S2 episodes in native 4K 60fps with Dolby Atmos Hindi Dub audio!',
    targetAudience: 'all',
    publishDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    linkUrl: '/subscription',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann_schedule_update',
    title: '📅 Weekly Release Schedule: New Episodes Every Tuesday & Friday 6 PM IST',
    message: 'Catch exclusive first-look episodes at 6 PM IST sharp. VIP members enjoy 48-hour early access privileges.',
    targetAudience: 'all',
    publishDate: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    linkUrl: '/browse',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    let list: AnnouncementItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      snap.forEach((d) => {
        const a = d.data() as AnnouncementItem;
        if (a.active !== false) {
          list.push({ ...a, id: d.id });
        }
      });
    } catch (e) {
      console.warn('Firestore announcements fetch notice:', e);
    }

    if (list.length === 0) {
      list = MEMORY_ANNOUNCEMENTS;
    }

    list.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return NextResponse.json({ success: true, announcements: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
