import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ preferences: DEFAULT_NOTIFICATION_PREFERENCES });
    }

    const userData = userSnap.data();
    const preferences = userData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    console.error('Fetch preferences error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json({ error: 'Missing userId or preferences' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      await updateDoc(userDocRef, {
        notificationPreferences: preferences,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(
        userDocRef,
        {
          uid: userId,
          notificationPreferences: preferences,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, message: 'Notification preferences updated successfully' });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update preferences' }, { status: 500 });
  }
}
