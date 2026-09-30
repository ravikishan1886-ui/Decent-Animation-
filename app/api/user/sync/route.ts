import { NextRequest, NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, get, set, update } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, username, name, role, plan, subscriptionStatus, profileImage } = body;

    if (!uid || !email) {
      return NextResponse.json({ success: false, error: 'Missing uid or email' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const cleanUsername = username || name || email.split('@')[0];

    // Sync to Realtime Database at /users/{uid} if rtdb is available
    if (rtdb) {
      try {
        const rtdbUserRef = ref(rtdb, `users/${uid}`);
        const rtdbSnap = await get(rtdbUserRef);
        if (rtdbSnap.exists()) {
          await update(rtdbUserRef, {
            username: cleanUsername,
            name: cleanUsername,
            lastLogin: nowIso,
            updatedAt: nowIso,
          });
        } else {
          await set(rtdbUserRef, {
            uid,
            username: cleanUsername,
            name: cleanUsername,
            email,
            role: role || 'user',
            plan: plan || 'free',
            currentPlan: plan || 'free',
            planStartDate: null,
            planExpiryDate: null,
            subscriptionStatus: subscriptionStatus || 'none',
            profileImage: profileImage || '',
            createdAt: nowIso,
            lastLogin: nowIso,
          });
        }
      } catch (rtdbErr) {
        console.warn('Realtime database sync warning:', rtdbErr);
      }
    }

    // Also persist to Firestore for existing features
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const profileData = {
        uid,
        email,
        username: cleanUsername,
        name: cleanUsername,
        role: role || 'user',
        plan: plan || 'free',
        currentPlan: plan || 'free',
        subscriptionStatus: subscriptionStatus || 'none',
        updatedAt: nowIso,
        ...(snap.exists() ? {} : { createdAt: nowIso }),
      };
      await setDoc(userRef, profileData, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore fallback sync warning:', fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('User sync API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
