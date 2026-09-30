import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PollItem } from '@/lib/types';

let MEMORY_POLLS: PollItem[] = [
  {
    id: 'poll_next_donghua_2026',
    pollId: 'poll_next_donghua_2026',
    question: 'Which epic Donghua Saga should Decent Animation dub in Hindi next?',
    description: 'Vote for the next grand cultivation donghua to get exclusive Hindi dubbing & 4K release!',
    options: [
      { id: 'opt_1', text: 'Shrouding the Heavens (Zhe Tian) Season 2', votes: 428 },
      { id: 'opt_2', text: 'Renegade Immortal (Xian Ni) Core Formation Arc', votes: 612 },
      { id: 'opt_3', text: 'A Record of a Mortal’s Journey to Immortality S3', votes: 389 },
      { id: 'opt_4', text: 'The Great Ruler (Da Zhu Zai) Northern Arc', votes: 245 },
    ],
    status: 'active',
    allowedPlans: 'all',
    totalVotes: 1674,
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    endAt: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(),
  },
  {
    id: 'poll_vip_special_voice',
    pollId: 'poll_vip_special_voice',
    question: 'VIP Exclusive: Voice actor style preference for Heavenly Flame arc?',
    description: 'Select the primary voice style for Medusa Queen and Heavenly Emperor in upcoming sagas.',
    options: [
      { id: 'opt_v1', text: 'Deep Imperial & Echoing Sanskrit Style', votes: 145 },
      { id: 'opt_v2', text: 'Modern Cinematic Anime Tone', votes: 98 },
      { id: 'opt_v3', text: 'Traditional Mythological Hindi Accent', votes: 184 },
    ],
    status: 'active',
    allowedPlans: 'basic+',
    totalVotes: 427,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    endAt: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';

    let polls: PollItem[] = [];

    try {
      const snap = await getDocs(collection(db, 'polls'));
      snap.forEach((d) => {
        polls.push({ ...(d.data() as PollItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore polls fetch notice:', e);
    }

    if (polls.length === 0) {
      polls = MEMORY_POLLS;
    }

    // Check if user has voted on each poll
    let userVotesMap: Record<string, string> = {};
    if (userId) {
      try {
        const votesSnap = await getDocs(collection(db, 'pollVotes'));
        votesSnap.forEach((d) => {
          const v = d.data();
          if (v.userId === userId) {
            userVotesMap[v.pollId] = v.optionId;
          }
        });
      } catch (e) {
        console.warn('Firestore user poll votes check notice:', e);
      }
    }

    return NextResponse.json({
      success: true,
      polls: polls.filter((p) => p.status === 'active'),
      userVotes: userVotesMap,
    });
  } catch (err: any) {
    console.error('Polls GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch polls' }, { status: 500 });
  }
}
