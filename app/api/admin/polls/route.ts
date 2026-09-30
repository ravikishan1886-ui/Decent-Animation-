import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isDesignatedAdmin } from '@/lib/admin-config';
import { PollItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = req.headers.get('x-admin-email') || searchParams.get('adminEmail') || '';

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let polls: PollItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'polls'));
      snap.forEach((d) => {
        polls.push({ ...(d.data() as PollItem), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore polls fetch notice:', e);
    }

    return NextResponse.json({ success: true, polls });
  } catch (err: any) {
    console.error('Admin polls GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pollId, question, description, options, allowedPlans, endAt, adminEmail } = body;

    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    if (action === 'CREATE') {
      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json({ error: 'Question and at least 2 options are required.' }, { status: 400 });
      }

      const newPollId = `poll_${Date.now()}`;
      const formattedOptions = options.map((opt: string, idx: number) => ({
        id: `opt_${idx + 1}`,
        text: typeof opt === 'string' ? opt : (opt as any).text,
        votes: 0,
      }));

      const newPoll: PollItem = {
        id: newPollId,
        pollId: newPollId,
        question: question.trim(),
        description: description || '',
        options: formattedOptions,
        status: 'active',
        allowedPlans: allowedPlans || 'all',
        totalVotes: 0,
        createdAt: new Date().toISOString(),
        endAt: endAt || new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(),
      };

      try {
        await setDoc(doc(db, 'polls', newPollId), newPoll);
      } catch (e) {
        console.warn('Poll create notice:', e);
      }

      return NextResponse.json({ success: true, poll: newPoll });
    } else if (action === 'CLOSE') {
      if (!pollId) return NextResponse.json({ error: 'pollId is required' }, { status: 400 });
      await updateDoc(doc(db, 'polls', pollId), { status: 'closed' });
      return NextResponse.json({ success: true, message: 'Poll closed successfully.' });
    } else if (action === 'DELETE') {
      if (!pollId) return NextResponse.json({ error: 'pollId is required' }, { status: 400 });
      await deleteDoc(doc(db, 'polls', pollId));
      return NextResponse.json({ success: true, message: 'Poll deleted successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin polls POST error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
