import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { LiveStreamItem } from '@/lib/types';

let MEMORY_LIVESTREAMS: LiveStreamItem[] = [
  {
    id: 'live_donghua_premier_2026',
    liveId: 'live_donghua_premier_2026',
    title: '🔴 Grand Premiere: Soul Land Season 2 Episode 250 (Hindi Dub Special)',
    description: 'Join the live watch party with Decent Animation dubbing team, live chat, and Super Chat shoutouts!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    status: 'live',
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    accessLevel: 'free',
    viewerCount: 1420,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'live_vip_qna_cultivation',
    liveId: 'live_vip_qna_cultivation',
    title: '🔴 VIP Exclusive: Decent Animation Directors Q&A & S6 Sneak Peek',
    description: 'Early preview of upcoming BTTH Season 6 CGI models, soundtrack teasers, and subscriber Q&A.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    status: 'scheduled',
    startTime: new Date(Date.now() + 3600 * 1000 * 6).toISOString(),
    accessLevel: 'vip',
    viewerCount: 0,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    let lives: LiveStreamItem[] = [];

    try {
      const snap = await getDocs(collection(db, 'liveStreams'));
      snap.forEach((d) => {
        lives.push({ ...(d.data() as LiveStreamItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore liveStreams fetch notice:', e);
    }

    if (lives.length === 0) {
      lives = MEMORY_LIVESTREAMS;
    }

    // Sort: 'live' first, then 'scheduled', then 'ended'
    lives.sort((a, b) => {
      const order = { live: 1, scheduled: 2, ended: 3 };
      return (order[a.status] || 4) - (order[b.status] || 4);
    });

    return NextResponse.json({
      success: true,
      liveStreams: lives,
    });
  } catch (err: any) {
    console.error('Live streams GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch live streams' }, { status: 500 });
  }
}
