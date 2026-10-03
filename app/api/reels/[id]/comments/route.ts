import { NextRequest, NextResponse } from 'next/server';
import { readReelComments, writeReelComment } from '@/lib/reel-store';
import { ReelCommentItem } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = readReelComments(id);
    return NextResponse.json({ comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.userId || !body.text?.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const newComment: ReelCommentItem = {
      id: `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reelId: id,
      userId: body.userId,
      username: body.username || body.userEmail?.split('@')[0] || 'Cultivator',
      userEmail: body.userEmail || '',
      profileImage: body.profileImage || '',
      userPlan: body.userPlan || 'free',
      text: body.text.trim(),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = writeReelComment(newComment);
    return NextResponse.json({ success: true, comments: updatedComments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
