import { NextRequest, NextResponse } from 'next/server';
import {
  handleUserCreatedEvent,
  handlePasswordResetConfirmationEvent,
  handleVideoPublishedEvent,
} from '@/lib/notification-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, payload } = body;

    if (!event || !payload) {
      return NextResponse.json({ error: 'Missing event name or payload' }, { status: 400 });
    }

    switch (event) {
      case 'USER_CREATED': {
        const { userId, userName, userEmail } = payload;
        if (!userEmail) {
          return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
        }
        const result = await handleUserCreatedEvent({
          userId: userId || 'user_' + Date.now(),
          userName: userName || userEmail.split('@')[0],
          userEmail,
        });
        return NextResponse.json({ success: true, result });
      }

      case 'PASSWORD_RESET_CONFIRMATION': {
        const { userEmail, userName, userId } = payload;
        if (!userEmail) {
          return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 });
        }
        const result = await handlePasswordResetConfirmationEvent({
          userEmail,
          userName,
          userId,
        });
        return NextResponse.json({ success: true, result });
      }

      case 'VIDEO_PUBLISHED': {
        const { id, title, episodeNumber, donghuaName, thumbnailUrl, description } = payload;
        if (!id || !title) {
          return NextResponse.json({ error: 'Missing video id or title' }, { status: 400 });
        }
        const result = await handleVideoPublishedEvent({
          id,
          title,
          episodeNumber,
          donghuaName,
          thumbnailUrl: thumbnailUrl || '',
          description: description || 'A new exciting episode has just dropped on Decent Animation.',
        });
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ error: `Unsupported notification event: ${event}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Notification event route error:', error);
    return NextResponse.json({ error: error.message || 'Notification processing failed' }, { status: 500 });
  }
}
