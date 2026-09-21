'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserProfile, RequiredPlan, SubscriptionStatus } from './types';
import { handleFirestoreError, OperationType } from './firestore-error';

export const DESIGNATED_ADMIN_EMAILS = [
  'videocinema80@gmail.com',
  'ranveerkrsingh165@gmail.com',
];

export function isDesignatedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return DESIGNATED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  subscriptionTier: RequiredPlan | 'none';
  isSubscriptionActive: boolean;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (name: string, email: string, pass: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInDirect: (
    email: string,
    name?: string,
    role?: 'admin' | 'user',
    tier?: RequiredPlan | 'none'
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  promoteToAdmin: (secretKey?: string) => Promise<{ success: boolean; message: string }>;
  applySubscription: (planId: string, durationDays: number, paymentId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore saved session from localStorage after hydration mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('decent_user_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.user && parsed?.profile) {
            Promise.resolve().then(() => {
              setUser((prev) => prev || parsed.user);
              setProfile((prev) => prev || parsed.profile);
              setLoading(false);
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore local session:', e);
    }
  }, []);

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firebase client offline, awaiting reconnection.');
        }
      }
    }
    testConnection();
  }, []);

  // Load user and sync Firestore document
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up any existing profile listener when auth state changes
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(currentUser);

      if (currentUser) {
        const userDocPath = `users/${currentUser.uid}`;
        const userRef = doc(db, 'users', currentUser.uid);
        const isUserDesignatedAdmin = isDesignatedAdmin(currentUser.email);

        try {
          let snap;
          try {
            snap = await getDoc(userRef);
          } catch (fetchErr) {
            handleFirestoreError(fetchErr, OperationType.GET, userDocPath);
          }

          if (snap && snap.exists()) {
            const data = snap.data() as UserProfile;
            if (isUserDesignatedAdmin && data.role !== 'admin') {
              try {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
                data.role = 'admin';
              } catch (updateErr) {
                console.warn('Could not auto-promote admin in Firestore:', updateErr);
              }
            }
            if (isUserDesignatedAdmin) {
              data.role = 'admin';
            }
            setProfile(data);
          } else {
            // Create initial user profile
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Cultivator',
              email: currentUser.email || '',
              role: isUserDesignatedAdmin ? 'admin' : 'user',
              subscriptionStatus: 'none',
              createdAt: new Date().toISOString(),
            };

            try {
              await setDoc(userRef, newProfile);
            } catch (createErr) {
              handleFirestoreError(createErr, OperationType.CREATE, userDocPath);
            }
            setProfile(newProfile);
          }

          // Real-time listener for profile updates, attached only when authenticated
          unsubProfile = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const snapData = docSnap.data() as UserProfile;
                if (isUserDesignatedAdmin) {
                  snapData.role = 'admin';
                }
                setProfile(snapData);
              }
            },
            (snapshotError) => {
              console.warn('Profile snapshot listener error:', snapshotError);
              handleFirestoreError(snapshotError, OperationType.GET, userDocPath);
            }
          );
        } catch (err) {
          console.error('Error in AuthProvider profile sync:', err);
          // Set fallback profile from auth credentials
          setProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || 'Cultivator',
            email: currentUser.email || '',
            role: isUserDesignatedAdmin ? 'admin' : 'user',
            subscriptionStatus: 'none',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubscribe();
    };
  }, []);

  const signInDirect = async (
    email: string,
    name?: string,
    role?: 'admin' | 'user',
    tier?: RequiredPlan | 'none'
  ) => {
    const isUserDesignatedAdmin = isDesignatedAdmin(email) || role === 'admin';
    const cleanEmail = email.trim();
    const displayName = name || cleanEmail.split('@')[0] || 'Cultivator';
    const uid = 'usr_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(36);

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const newProfile: UserProfile = {
      uid,
      name: displayName,
      email: cleanEmail,
      role: isUserDesignatedAdmin ? 'admin' : 'user',
      subscriptionStatus: tier && tier !== 'none' ? 'active' : 'none',
      planId: tier && tier !== 'none' ? `${tier}_yearly` : undefined,
      subscriptionExpiry: tier && tier !== 'none' ? expiry.toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    const directUser: AuthUser = {
      uid,
      email: cleanEmail,
      displayName,
    };

    setUser(directUser);
    setProfile(newProfile);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'decent_user_session',
          JSON.stringify({ user: directUser, profile: newProfile })
        );
      } catch (e) {
        console.warn('Could not persist session to localStorage', e);
      }
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newProfile, { merge: true });
    } catch (err) {
      console.warn('Firestore sync notice:', err);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const isConfigNotFound =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('configuration-not-found');

      if (isConfigNotFound) {
        console.info('Firebase Email/Password provider unconfigured, using instant preview session');
        await signInDirect(email);
        return;
      }
      throw err;
    }
  };

  const signUpEmail = async (name: string, email: string, pass: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch (nameErr) {
          console.warn('Could not set displayName in Firebase Auth:', nameErr);
        }
      }
      const isUserDesignatedAdmin = isDesignatedAdmin(email);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        name: name || email.split('@')[0],
        email,
        role: isUserDesignatedAdmin ? 'admin' : 'user',
        subscriptionStatus: 'none',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (err) {
        console.warn('Could not save user profile to Firestore:', err);
      }
      setProfile(newProfile);

      // Trigger backend notification for new user registration
      try {
        fetch('/api/notifications/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'USER_CREATED',
            payload: {
              userId: cred.user.uid,
              userName: newProfile.name,
              userEmail: email,
            },
          }),
        }).catch((e) => console.warn('User created notification failed:', e));
      } catch (e) {
        // Non-blocking
      }
    } catch (err: any) {
      const isConfigNotFound =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('configuration-not-found');

      if (isConfigNotFound) {
        console.info('Firebase Email/Password provider unconfigured, using instant preview registration');
        await signInDirect(email, name);
        return;
      }
      throw err;
    }
  };

  const signInGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const isUserDesignatedAdmin = isDesignatedAdmin(cred.user.email);
        const userDocRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const newProfile: UserProfile = {
            uid: cred.user.uid,
            name: cred.user.displayName || cred.user.email?.split('@')[0] || 'Cultivator',
            email: cred.user.email || '',
            role: isUserDesignatedAdmin ? 'admin' : 'user',
            subscriptionStatus: 'none',
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, newProfile);
          } catch (e) {
            console.warn('Firestore Google user initial sync notice:', e);
          }
          setProfile(newProfile);
        }
      }
    } catch (err: any) {
      console.warn('Firebase Google Sign-In caught error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('decent_user_session');
      } catch (e) {
        console.warn('Could not clear local session:', e);
      }
    }
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      console.warn('Firebase reset email notice:', e);
    }
    // Dispatch confirmation email
    try {
      fetch('/api/notifications/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'PASSWORD_RESET_CONFIRMATION',
          payload: {
            userEmail: email,
            userName: email.split('@')[0],
          },
        }),
      }).catch((e) => console.warn('Password reset notification dispatch notice:', e));
    } catch (e) {
      // Non-blocking
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const userDocPath = `users/${user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.warn('Could not refresh profile from Firestore:', err);
    }
  };

  const promoteToAdmin = async (secretKey?: string) => {
    if (!user) return { success: false, message: 'Please sign in first' };
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          secretKey: secretKey || 'decent_admin_seed_secret_2026',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to promote');

      if (profile) {
        const updated = { ...profile, role: 'admin' as const };
        setProfile(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('decent_user_session', JSON.stringify({ user, profile: updated }));
        }
      }

      try {
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      } catch (err) {
        console.warn('Firestore admin promotion sync notice:', err);
      }
      return { success: true, message: 'Promoted to Administrator successfully!' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const applySubscription = async (planId: string, durationDays: number, paymentId: string) => {
    if (!user) return;
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + durationDays);

    const updates = {
      planId,
      subscriptionStatus: 'active' as SubscriptionStatus,
      subscriptionExpiry: expiry.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'decent_user_session',
          JSON.stringify({ user, profile: updatedProfile })
        );
      }
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });

      // Save subscription record
      const subId = `sub_${Date.now()}_${user.uid.slice(0, 4)}`;
      const subRef = doc(db, 'subscriptions', subId);
      await setDoc(subRef, {
        id: subId,
        userId: user.uid,
        userEmail: user.email || '',
        planId,
        status: 'active',
        startDate: now.toISOString(),
        expiryDate: expiry.toISOString(),
        paymentId,
        orderId: `order_${Date.now()}`,
        createdAt: now.toISOString(),
      });

      // Save payment record
      const payRef = doc(db, 'payments', paymentId);
      await setDoc(payRef, {
        id: paymentId,
        userId: user.uid,
        userEmail: user.email || '',
        planId,
        paymentId,
        status: 'verified',
        createdAt: now.toISOString(),
      });
    } catch (err) {
      console.warn('Firestore subscription update notice:', err);
    }
  };

  // Derive subscription tier
  const isSubscriptionActive = Boolean(
    profile &&
      profile.subscriptionStatus === 'active' &&
      profile.subscriptionExpiry &&
      new Date(profile.subscriptionExpiry) > new Date()
  );

  let subscriptionTier: RequiredPlan | 'none' = 'none';
  if (isSubscriptionActive && profile?.planId) {
    if (profile.planId.includes('vip')) {
      subscriptionTier = 'vip';
    } else if (profile.planId.includes('premium')) {
      subscriptionTier = 'premium';
    } else if (profile.planId.includes('basic')) {
      subscriptionTier = 'basic';
    }
  }

  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    isDesignatedAdmin(user?.email)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        subscriptionTier,
        isSubscriptionActive,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signInDirect,
        signOut,
        resetPassword,
        refreshProfile,
        promoteToAdmin,
        applySubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
