import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { CommentItem, RequiredPlan } from '@/lib/types';
import { getUserPlan } from '@/lib/authorization';

// In-memory comment fallback cache
let MEMORY_COMMENTS: CommentItem[] = [
  {
    id: 'cmt_vip_1',
    userId: 'usr_sword_immortal',
    username: 'Sword Immortal Li',
    profileImage: '',
    videoId: 'btth-s5-ep1',
    text: 'Xiao Yan breaking through the Dou Huang realm in this Hindi Dub is unbelievable! The audio mixing and punch SFX are crisp 🔥',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    userPlan: 'vip',
    badge: '👑 VIP Cultivator',
    isPinned: true,
    isHighlighted: true,
    likesCount: 38,
    likedBy: [],
    parentId: null,
    status: 'active',
  },
  {
    id: 'cmt_prem_2',
    userId: 'usr_cloud_sage',
    username: 'Cloud Sage Chen',
    profileImage: '',
    videoId: 'btth-s5-ep1',
    text: 'The 1080p bitrate is so smooth on my screen. Can we please get the next episode early as well?',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    userPlan: 'premium',
    badge: '⭐ Premium Cultivator',
    isPinned: false,
    isHighlighted: false,
    likesCount: 14,
    likedBy: [],
    parentId: null,
    status: 'active',
  },
  {
    id: 'cmt_basic_3',
    userId: 'usr_novice_ling',
    username: 'Disciple Ling',
    profileImage: '',
    videoId: 'btth-s5-ep1',
    text: 'Decent Animation has the best Hindi Dubbing quality for cultivation anime!',
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    userPlan: 'basic',
    badge: '🗡️ Basic Cultivator',
    isPinned: false,
    isHighlighted: false,
    likesCount: 7,
    likedBy: [],
    parentId: null,
    status: 'active',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('limit') || '10', 10);

    let comments: CommentItem[] = [];

    try {
      const colRef = collection(db, 'comments');
      const snap = await getDocs(colRef);
      snap.forEach((d) => {
        const c = d.data() as CommentItem;
        if (!videoId || c.videoId === videoId) {
          if (c.status !== 'hidden') {
            comments.push({ ...c, id: c.id || d.id });
          }
        }
      });
    } catch (e) {
      console.warn('Firestore comments fetch notice:', e);
    }

    if (comments.length === 0) {
      comments = MEMORY_COMMENTS.filter((c) => !videoId || c.videoId === videoId);
    }

    // Sort: Pinned comments first, then descending by createdAt
    comments.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = comments.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = comments.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      comments: paginated,
      total,
      page,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (err: any) {
    console.error('Comments GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

// Rate limiting map for spam prevention (1 comment per 5 seconds per user)
const userLastCommentTime = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, text, userId, username, userPlan, profileImage, parentId, replyToUsername } = body;

    if (!videoId || !text || !text.trim() || !userId) {
      return NextResponse.json({ error: 'Video ID, User ID, and comment text are required.' }, { status: 400 });
    }

    // Anti-spam check
    const now = Date.now();
    const lastTime = userLastCommentTime.get(userId) || 0;
    if (now - lastTime < 4000) {
      return NextResponse.json({ error: 'Please wait a moment before sending another message (Anti-spam cooldown).' }, { status: 429 });
    }
    userLastCommentTime.set(userId, now);

    const plan: RequiredPlan = (userPlan || 'free').toLowerCase() as RequiredPlan;
    const isVip = plan === 'vip';
    let badge = 'Free Cultivator';
    if (isVip) badge = '👑 VIP Cultivator';
    else if (plan === 'premium') badge = '⭐ Premium Cultivator';
    else if (plan === 'basic') badge = '🗡️ Basic Cultivator';

    const commentId = `cmt_${Date.now()}_${userId.slice(0, 4)}`;
    const newComment: CommentItem = {
      id: commentId,
      userId,
      username: username || 'Cultivator',
      profileImage: profileImage || '',
      videoId,
      text: text.trim().slice(0, 800),
      createdAt: new Date().toISOString(),
      userPlan: plan,
      badge,
      isPinned: false,
      isHighlighted: isVip, // VIP comments have auto-highlighted visual treatment
      likesCount: 0,
      likedBy: [],
      parentId: parentId || null,
      replyToUsername: replyToUsername || undefined,
      status: 'active',
    };

    try {
      await setDoc(doc(db, 'comments', commentId), newComment);
    } catch (e) {
      console.warn('Firestore comment save notice:', e);
    }

    MEMORY_COMMENTS.unshift(newComment);

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (err: any) {
    console.error('Comments POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to post comment' }, { status: 500 });
  }
}
