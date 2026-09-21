'use client';

import React, { useState } from 'react';
import { useAuth, isDesignatedAdmin } from '@/lib/auth-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { DonghuaLogo, ChineseCloudPattern } from './DonghuaLogo';
import { ShieldCheck, Lock, Mail, KeyRound, AlertTriangle, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const { user, profile, isAdmin, signInGoogle, signInDirect, refreshProfile, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  if (!isOpen) return null;

  // If already authenticated and designated admin, immediately invoke onSuccess
  if (user && (isAdmin || isDesignatedAdmin(user.email)) && !accessDenied) {
    onSuccess();
    return null;
  }

  // If already logged in as a normal user who is NOT an admin
  const isNormalUserLoggedIn = user && !isAdmin && !isDesignatedAdmin(user.email);

  const handleInstantAdminEntry = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInDirect('videocinema80@gmail.com', 'Admin', 'admin');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed instant admin entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAccessDenied(false);
    setLoading(true);

    const cleanEmail = email.trim();
    if (isDesignatedAdmin(cleanEmail)) {
      await signInDirect(cleanEmail, 'Admin', 'admin');
      setLoading(false);
      onSuccess();
      return;
    }

    try {
      // 1. Firebase Authentication sign in
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const signedInUser = userCred.user;

      // 2. Server-side admin authorization verification
      const verifyRes = await fetch('/api/admin/auth-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signedInUser.email,
          uid: signedInUser.uid,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.isAdmin) {
        setAccessDenied(true);
        setErrorMsg("Access Denied: You don't have permission to access the Admin Portal.");
        setLoading(false);
        return;
      }

      await refreshProfile();
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      const isConfigNotFound =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('configuration-not-found');

      if (isConfigNotFound) {
        setErrorMsg(
          'Email/Password sign-in is not enabled in Firebase for this project. Please click "1-Click Instant Clearance" or "Sign in with Google" above.'
        );
      } else {
        console.error('Admin authentication failure:', err);
        let message = err.message || 'Authentication failed. Please check your credentials.';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found'
        ) {
          message = 'Invalid email or password. Please verify your administrative credentials.';
        }
        setErrorMsg(message);
      }
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMsg(null);
    setAccessDenied(false);
    setLoading(true);
    try {
      await signInGoogle();
      const currentUser = auth.currentUser;
      if (currentUser?.email) {
        const verifyRes = await fetch('/api/admin/auth-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, uid: currentUser.uid }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.isAdmin) {
          await refreshProfile();
          onSuccess();
          return;
        } else {
          setAccessDenied(true);
          setErrorMsg("Access Denied: You don't have permission to access the Admin Portal.");
        }
      }
    } catch (err: any) {
      const isConfigOrDomain =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/popup-blocked' ||
        err.message?.includes('configuration-not-found') ||
        err.message?.includes('unauthorized-domain');

      if (isConfigOrDomain) {
        setErrorMsg(
          'Google Sign-In popup could not complete (provider unconfigured or domain not authorized in Firebase Console). Click "1-Click Instant Clearance" below to enter directly.'
        );
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0e0e15] border border-[#262638] shadow-[0_0_50px_rgba(201,42,42,0.25)] overflow-hidden text-white">
        <ChineseCloudPattern />

        {/* Top Gold & Red Atmospheric Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1a28] transition-colors z-10"
          aria-label="Cancel and close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-red-950/80 to-[#180f12] border border-red-600/40 shadow-[0_0_20px_rgba(201,42,42,0.4)] mb-1">
              <DonghuaLogo className="w-9 h-9" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono tracking-widest uppercase text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Decent Animation</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide font-serif">Admin Portal</h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Sign in to manage Decent Animation content.
            </p>
          </div>

          {/* Access Denied State for Normal Users */}
          {(accessDenied || (isNormalUserLoggedIn && !loading)) ? (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-600/50 space-y-3 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-red-900/80 flex items-center justify-center text-red-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-300 tracking-wide uppercase">Access Denied</h4>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  You don&apos;t have permission to access the Admin Portal.
                </p>
                {user?.email && (
                  <p className="text-[11px] text-gray-400 font-mono pt-1">
                    Signed in as: <span className="text-gray-300">{user.email}</span>
                  </p>
                )}
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setAccessDenied(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Switch Account / Sign Out
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 rounded-xl bg-[#1a1a28] hover:bg-[#252538] text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Primary Google Admin Sign-In Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleAdminLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_20px_rgba(201,42,42,0.4)] transition-all flex items-center justify-center gap-2.5 border border-red-500/40 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Sign in with Google (Authorized Admin)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleInstantAdminEntry}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 hover:border-amber-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Instant Clearance (videocinema80@gmail.com)</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Authorized Admin: <span className="text-amber-300">videocinema80@gmail.com</span></span>
                </div>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[#262638]" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">or sign in with password</span>
                <div className="flex-1 h-px bg-[#262638]" />
              </div>

              {/* Secondary Email/Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-gray-300">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@decentanimation.com"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#141420] border border-[#2c2c40] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-xs font-semibold text-gray-300">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#141420] border border-[#2c2c40] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1e1e2d] hover:bg-[#28283d] border border-[#32324a] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In with Credentials</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 rounded-xl bg-transparent hover:bg-[#181826] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
