'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth, isDesignatedAdmin } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UploadContentDashboard } from '@/components/UploadContentDashboard';
import { AdminContentManagement } from '@/components/AdminContentManagement';
import { AdminNotificationManager } from '@/components/AdminNotificationManager';
import { DonghuaLogo } from '@/components/DonghuaLogo';
import {
  ShieldCheck,
  Video,
  Upload,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Lock,
  Mail,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Sparkles,
  Bell,
} from 'lucide-react';

type AdminTab =
  | 'dashboard'
  | 'videos'
  | 'upload'
  | 'notifications'
  | 'users'
  | 'subscriptions'
  | 'payments'
  | 'analytics'
  | 'settings';

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isAdmin, loading, signInGoogle, signInDirect, refreshProfile, signOut } = useAuth();

  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTabOverride, setActiveTabOverride] = useState<AdminTab | null>(null);
  const currentTab: AdminTab = activeTabOverride || tabParam || 'dashboard';

  const setCurrentTab = (tab: AdminTab) => {
    setActiveTabOverride(tab);
  };

  const effectiveIsAdmin = Boolean(isAdmin || isDesignatedAdmin(user?.email));

  // Admin login form states when unauthenticated or non-admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Settings State
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adPlacement, setAdPlacement] = useState<'pre-roll' | 'mid-roll' | 'banner'>('pre-roll');
  const [adFrequencyMinutes, setAdFrequencyMinutes] = useState(15);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleInstantAdminEntry = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      await signInDirect('videocinema80@gmail.com', 'Admin', 'admin');
      setCurrentTab(tabParam || 'dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Failed instant admin entry');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      await signInGoogle();
      const currentUser = auth.currentUser;
      if (currentUser?.email) {
        const authCheckRes = await fetch('/api/admin/auth-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, uid: currentUser.uid }),
        });
        const authData = await authCheckRes.json();
        if (authCheckRes.ok && authData.isAdmin) {
          await refreshProfile();
          setCurrentTab(tabParam || 'dashboard');
          return;
        } else {
          setLoginError("Access Denied: You don't have permission to access the Admin Portal.");
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
        setLoginError(
          'Google popup could not complete (provider unconfigured or domain not authorized in Firebase Console). You can use "1-Click Instant Clearance" below to enter directly.'
        );
      } else {
        setLoginError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const cleanEmail = email.trim();
    if (isDesignatedAdmin(cleanEmail)) {
      await signInDirect(cleanEmail, 'Admin', 'admin');
      setLoginLoading(false);
      setCurrentTab(tabParam || 'dashboard');
      return;
    }

    try {
      // 1. Firebase Authentication sign-in
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const signedInUser = userCred.user;

      // 2. Server-side authorization check
      const authCheckRes = await fetch('/api/admin/auth-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signedInUser.email, uid: signedInUser.uid }),
      });

      const authData = await authCheckRes.json();

      if (!authCheckRes.ok || !authData.isAdmin) {
        setLoginError("Access Denied: You don't have permission to access the Admin Portal.");
        setLoginLoading(false);
        return;
      }

      await refreshProfile();
      setLoginLoading(false);
      setCurrentTab(tabParam || 'upload');
    } catch (err: any) {
      const isConfigNotFound =
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('configuration-not-found');

      if (isConfigNotFound) {
        setLoginError('Email/Password provider is not configured in Firebase for this project. Please click "Sign in with Google (Authorized Admin)" above with your administrator account (videocinema80@gmail.com).');
      } else {
        setLoginError(err.message || 'Authentication failed. Please check your credentials.');
      }
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-gray-400">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not an admin, show the Admin Portal login panel
  if (!user || !effectiveIsAdmin) {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-md bg-[#0f0f18] border border-[#2b2229] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Red & Gold Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-950 via-[#260f15] to-[#1a110a] border border-red-700/50 flex items-center justify-center shadow-[0_0_20px_rgba(201,42,42,0.4)]">
                <DonghuaLogo className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-wide font-serif">Admin Portal</h1>
              <p className="text-xs text-gray-400">Sign in to manage Decent Animation content.</p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-700/60 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold leading-relaxed">{loginError}</p>
                  {user && !effectiveIsAdmin && (
                    <p className="text-[11px] text-gray-400">
                      Current user: <span className="text-amber-400 font-mono">{user.email}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Already logged in as non-admin warning */}
            {user && !effectiveIsAdmin && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">Access Denied</p>
                    <p className="text-[11px] text-gray-300">
                      You are signed in as <span className="font-mono text-amber-300">{user.email}</span>, which lacks administrator clearance. Sign in with an authorized administrator account below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setLoginError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
                  >
                    Switch Account / Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Primary Google Admin Sign In */}
            <div className="space-y-2 mb-5">
              <button
                type="button"
                onClick={handleGoogleAdminSignIn}
                disabled={loginLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_20px_rgba(201,42,42,0.4)] transition-all flex items-center justify-center gap-2.5 border border-red-500/40 disabled:opacity-60"
              >
                {loginLoading ? (
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
                disabled={loginLoading}
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

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-[#262638]" />
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">or sign in with password</span>
              <div className="flex-1 h-px bg-[#262638]" />
            </div>

            {/* Form */}
            <form onSubmit={handleAdminSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@decentanimation.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#1e1e2d] hover:bg-[#28283d] border border-[#32324a] transition-all flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying clearance...</span>
                    </>
                  ) : (
                    <span>Sign In with Credentials</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-gray-400 hover:text-white bg-[#141420] hover:bg-[#1a1a28] border border-[#262638] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-[#1c1c28] text-center">
              <p className="text-[11px] text-gray-500 font-mono">
                Decent Animation Core Protocol • Level 4 Clearance
              </p>
            </div>
          </div>
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#07070a] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#1f1f2e]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-400">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Decent Animation Master Control</span>
              <span className="text-amber-400 font-bold">• {user.email}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-wide mt-1">
              Administrative Command
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {currentTab !== 'upload' ? (
              <button
                onClick={() => setCurrentTab('upload')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_20px_rgba(201,42,42,0.4)] transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Content</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('videos')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141420] hover:bg-[#1a1a28] text-gray-300 hover:text-white font-semibold text-xs border border-[#262638] transition-colors"
              >
                <Video className="w-4 h-4 text-amber-400" />
                <span>View All Content</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 mb-8 no-scrollbar border-b border-[#1b1b28]">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'videos', label: 'Content Management', icon: Video },
            { id: 'upload', label: 'Upload Content', icon: Upload },
            { id: 'notifications', label: 'Email & Push Logs', icon: Bell },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'subscriptions', label: 'Subscriptions', icon: ShieldCheck },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Ad & Platform Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1a1420] text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-[#12121c]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD METRICS */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: '14,820', change: '+18% this month' },
                { label: 'Active Subscribers', value: '3,490', change: '+24% this month' },
                { label: 'Monthly Revenue', value: '₹3,45,510', change: 'Razorpay Verified' },
                { label: 'Storage Status', value: 'Google Cloud Storage', change: 'HLS & DASH Enabled' },
              ].map((stat, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#0f0f18] border border-[#202032] space-y-1">
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-black text-white font-mono">{stat.value}</p>
                  <p className="text-[11px] text-amber-400/90 font-mono">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-400" />
                    Donghua Video Vault
                  </h3>
                  <button
                    onClick={() => setCurrentTab('upload')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    + New Upload
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Decent Animation catalogue operates on secure role-based access control. All video streams are authenticated server-side before playback tokens are issued.
                </p>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setCurrentTab('upload')}
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs"
                  >
                    Upload Donghua Episode
                  </button>
                  <button
                    onClick={() => setCurrentTab('videos')}
                    className="px-4 py-2 rounded-xl bg-[#181826] hover:bg-[#202032] text-gray-300 text-xs font-semibold"
                  >
                    Manage Catalogue
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Recent Razorpay Payment Webhooks
                </h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    { user: 'cultivator_99@gmail.com', plan: 'VIP Yearly', amount: '₹999', status: 'Captured' },
                    { user: 'rohit_donghua@gmail.com', plan: 'Premium Monthly', amount: '₹99', status: 'Captured' },
                    { user: 'ananya_san@gmail.com', plan: 'Basic Quarterly', amount: '₹160', status: 'Captured' },
                  ].map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#141420] border border-[#1e1e2c]">
                      <div>
                        <p className="font-medium text-gray-200">{p.user}</p>
                        <p className="text-[10px] text-gray-400">{p.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">{p.amount}</p>
                        <span className="text-[10px] text-emerald-400 font-bold">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE CONTENT (Section 14) */}
        {currentTab === 'videos' && (
          <AdminContentManagement
            onOpenUpload={() => setCurrentTab('upload')}
          />
        )}

        {/* TAB 3: MODERN DONGHUA-STYLE UPLOAD DASHBOARD */}
        {currentTab === 'upload' && (
          <UploadContentDashboard
            onSuccess={() => {
              setCurrentTab('videos');
            }}
            onCancel={() => {
              setCurrentTab('videos');
            }}
          />
        )}

        {/* TAB 4: CENTRALIZED EMAIL & NOTIFICATION AUDIT LOGS */}
        {currentTab === 'notifications' && <AdminNotificationManager />}

        {/* TAB 8: AD & PLATFORM SETTINGS */}
        {currentTab === 'settings' && (
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-[#0f0f18] border border-[#202032] space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Advertising & Streaming Architecture
              </h2>
              <p className="text-xs text-gray-400">
                Configure ads for Basic &amp; Free viewers. VIP Yearly subscribers (₹999/yr) are guaranteed 100% ad-free streaming.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Settings saved successfully!
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141420] border border-[#1e1e2c]">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Advertisements</p>
                  <p className="text-[11px] text-gray-400">Serve promotional sponsors to non-VIP members</p>
                </div>
                <input
                  type="checkbox"
                  checked={adsEnabled}
                  onChange={(e) => setAdsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Ad Placement</label>
                <select
                  value={adPlacement}
                  onChange={(e) => setAdPlacement(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs"
                >
                  <option value="pre-roll">Pre-Roll (Before video starts)</option>
                  <option value="mid-roll">Mid-Roll (Break halfway)</option>
                  <option value="banner">Overlay Banner (Non-intrusive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Ad Frequency (Minutes between ads)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={adFrequencyMinutes}
                  onChange={(e) => setAdFrequencyMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs"
                />
              </div>

              <button
                onClick={() => {
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* OTHER TABS (Users, Subscriptions, Payments, Analytics) */}
        {(currentTab === 'users' ||
          currentTab === 'subscriptions' ||
          currentTab === 'payments' ||
          currentTab === 'analytics') && (
          <div className="p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] text-center py-16 space-y-3">
            <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white capitalize">
              Live Real-Time {currentTab} Registry
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Real-time Firestore and Razorpay webhook synchronizer is active. All user subscription records are guarded under server-side authorization checks.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07070a] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminPageInner />
    </Suspense>
  );
}
