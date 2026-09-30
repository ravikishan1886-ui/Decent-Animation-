import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { LiveChatMessage, RequiredPlan } from '@/lib/types';

let MEMORY_LIVE_CHATS: Record<string, LiveChatMessage[]> = {
  live_donghua_premier_2026: [
    {
      id: 'msg_1',
      liveId: 'live_donghua_premier_2026',
      userId: 'usr_sword_immortal',
      username: 'Sword Immortal Li',
      message: 'The sound design on this episode is unreal!! ⚔️🔥',
      userPlan: 'vip',
      badge: '👑 VIP Cultivator',
      isSuperChat: true,
      superChatAmount: 500,
      createdAt: new Date(Date.now() - 60000 * 5).toISOString(),
    },
    {
      id: 'msg_2',
      liveId: 'live_donghua_premier_2026',
      userId: 'usr_cloud_sage',
      username: 'Cloud Sage Chen',
      message: 'Tang San using the Hammer technique gave me chills!',
      userPlan: 'premium',
      badge: '⭐ Premium Cultivator',
      isSuperChat: false,
      createdAt: new Date(Date.now() - 60000 * 3).toISOString(),
    },
    {
      id: 'msg_3',
      liveId: 'live_donghua_premier_2026',
      userId: 'usr_novice_ling',
      username: 'Disciple Ling',
      message: 'Hi everyone! Decent Animation never disappoints 👏',
      userPlan: 'free',
      badge: '🗡️ Basic Cultivator',
      isSuperChat: false,
      createdAt: new Date(Date.now() - 60000 * 1).toISOString(),
    },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const liveId = id || 'live_donghua_premier_2026';

    let messages: LiveChatMessage[] = [];

    try {
      const snap = await getDocs(collection(db, 'liveStreams', liveId, 'chat'));
      snap.forEach((d) => {
        messages.push({ ...(d.data() as LiveChatMessage), id: d.id });
      });
    } catch (e) {
      console.warn('Firestore live chat fetch notice:', e);
    }

    if (messages.length === 0) {
      messages = MEMORY_LIVE_CHATS[liveId] || [];
    }

    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      success: true,
      messages: messages.slice(-100),
    });
  } catch (err: any) {
    console.error('Live chat GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const liveId = id || 'live_donghua_premier_2026';
    const body = await req.json();
    const { userId, username, profileImage, message, userPlan, isSuperChat, superChatAmount } = body;

    if (!userId || !message || !message.trim()) {
      return NextResponse.json({ error: 'Message and userId are required.' }, { status: 400 });
    }

    const plan: RequiredPlan = (userPlan || 'free').toLowerCase() as RequiredPlan;
    let badge = 'Free Cultivator';
    if (plan === 'vip') badge = '👑 VIP Cultivator';
    else if (plan === 'premium') badge = '⭐ Premium Cultivator';
    else if (plan === 'basic') badge = '🗡️ Basic Cultivator';

    const msgId = `msg_${Date.now()}_${userId.slice(0, 4)}`;
    const newMsg: LiveChatMessage = {
      id: msgId,
      liveId,
      userId,
      username: username || 'Cultivator',
      profileImage: profileImage || '',
      message: message.trim().slice(0, 300),
      userPlan: plan,
      badge,
      isSuperChat: Boolean(isSuperChat),
      superChatAmount: superChatAmount ? Number(superChatAmount) : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'liveStreams', liveId, 'chat', msgId), newMsg);
    } catch (e) {
      console.warn('Firestore live chat save notice:', e);
    }

    if (!MEMORY_LIVE_CHATS[liveId]) MEMORY_LIVE_CHATS[liveId] = [];
    MEMORY_LIVE_CHATS[liveId].push(newMsg);

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (err: any) {
    console.error('Live chat POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
