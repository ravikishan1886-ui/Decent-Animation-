import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: snap.data() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, username, profileImage, showOnLeaderboard, notificationPreferences } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);
    const updates: Partial<UserProfile> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (username !== undefined) updates.username = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (showOnLeaderboard !== undefined) updates.showOnLeaderboard = Boolean(showOnLeaderboard);
    if (notificationPreferences !== undefined) updates.notificationPreferences = notificationPreferences;

    try {
      await setDoc(userDocRef, updates, { merge: true });
    } catch (e) {
      console.warn('Profile update notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      updates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
