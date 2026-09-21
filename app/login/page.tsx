'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { DonghuaLogo } from '@/components/DonghuaLogo';
import { Mail, Lock, ArrowRight, Sparkles, Shield, User, Crown } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);

  const { signInEmail, signInGoogle, signInDirect } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInEmail(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setError('Email/Password login is not enabled in this Firebase project. Click "Continue with Google" or use 1-Click Access below.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    setShowGoogleFallback(false);
    try {
      await signInGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      console.warn('Google login error:', err);
      const isConfigOrDomain =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.message?.includes('configuration-not-found') ||
        err.message?.includes('unauthorized-domain');

      if (isConfigOrDomain) {
        setShowGoogleFallback(true);
        setError(
          'Google popup could not finish in the current browser/iframe context (e.g. popups blocked or domain authorization needed in Firebase Console). You can continue with 1-Click Access below!'
        );
      } else {
        setError(err.message || 'Google authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string, name: string, role: 'admin' | 'user' = 'user', tier: 'none' | 'vip' | 'basic' = 'none') => {
    setError(null);
    setLoading(true);
    try {
      await signInDirect(targetEmail, name, role, tier);
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#11111a] border border-[#232334] shadow-2xl relative">
          <div className="text-center space-y-2 mb-6">
            <DonghuaLogo className="w-12 h-12 mx-auto" />
            <h1 className="text-2xl font-extrabold text-white font-serif">Welcome Back, Cultivator</h1>
            <p className="text-xs text-gray-400">
              Sign in to resume your Donghua episodes and active subscriptions
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Google Sign-in */}
          <div className="space-y-2 mb-5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full py-3 rounded-xl bg-[#181824] hover:bg-[#202030] border border-[#2d2d40] text-gray-100 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-md disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {showGoogleFallback && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <p className="font-semibold text-amber-300">Choose Instant Access:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('videocinema80@gmail.com', 'Admin User', 'admin')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#202030] text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Sign in as videocinema80@gmail.com (Admin)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('cultivator@decent.app', 'Cultivator', 'user')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#202030] text-gray-200 font-semibold text-xs border border-[#2d2d40] flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Continue as Member (cultivator@decent.app)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#232334] w-full" />
            <span className="bg-[#11111a] px-3 text-[11px] uppercase font-mono tracking-wider text-gray-500 shrink-0">
              or sign in with email
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cultivator@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181824] border border-[#2c2c3e] text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-300 uppercase">Password</label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181824] border border-[#2c2c3e] text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#c92a2a] via-[#e03131] to-amber-600 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-4 border-t border-[#1e1e2d] space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant 1-Click Sign-In</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('videocinema80@gmail.com', 'Admin User', 'admin')}
                className="py-2 px-2.5 rounded-xl bg-[#181824] hover:bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Admin Account</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('member@cultivator.com', 'Cultivator Member', 'user', 'vip')}
                className="py-2 px-2.5 rounded-xl bg-[#181824] hover:bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">VIP Cultivator</span>
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-amber-400 font-semibold hover:underline">
              Create one for free
            </Link>
          </p>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
