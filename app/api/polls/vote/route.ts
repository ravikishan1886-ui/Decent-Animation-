import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { PollItem } from '@/lib/types';
import { canUserVote } from '@/lib/authorization';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pollId, optionId, userId, userPlan } = body;

    if (!pollId || !optionId || !userId) {
      return NextResponse.json({ error: 'pollId, optionId, and userId are required.' }, { status: 400 });
    }

    const voteDocId = `${pollId}_${userId}`;
    const voteRef = doc(db, 'pollVotes', voteDocId);
    let voteSnap;
    try {
      voteSnap = await getDoc(voteRef);
    } catch (e) {
      console.warn('Vote check notice:', e);
    }

    if (voteSnap && voteSnap.exists()) {
      return NextResponse.json({ error: 'You have already cast your vote in this poll.' }, { status: 400 });
    }

    const pollRef = doc(db, 'polls', pollId);
    let pollSnap;
    try {
      pollSnap = await getDoc(pollRef);
    } catch (e) {
      console.warn('Poll fetch notice:', e);
    }

    let pollData: PollItem | null = null;
    if (pollSnap && pollSnap.exists()) {
      pollData = pollSnap.data() as PollItem;
    }

    // Authorization check
    if (pollData) {
      const authCheck = canUserVote({ uid: userId, currentPlan: userPlan }, pollData);
      if (!authCheck.allowed) {
        return NextResponse.json({ error: authCheck.reason || 'You are not eligible to vote in this poll.' }, { status: 403 });
      }

      // Increment option vote count
      const updatedOptions = (pollData.options || []).map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      });

      const updatedTotal = (pollData.totalVotes || 0) + 1;

      try {
        await updateDoc(pollRef, {
          options: updatedOptions,
          totalVotes: updatedTotal,
        });
      } catch (e) {
        console.warn('Poll vote update notice:', e);
      }
    }

    // Save vote record
    try {
      await setDoc(voteRef, {
        id: voteDocId,
        pollId,
        optionId,
        userId,
        votedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Vote save notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Vote registered successfully!',
      votedOptionId: optionId,
    });
  } catch (err: any) {
    console.error('Poll vote error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit vote' }, { status: 500 });
  }
}
