'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { NotificationPreferencesModal } from '@/components/NotificationPreferencesModal';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { WatchHistoryItem } from '@/lib/types';
import {
  User,
  Crown,
  History,
  Clock,
  Download,
  ShieldCheck,
  LogOut,
  Sparkles,
  Play,
  Key,
  Bell,
  Trash2,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

export default function UserDashboardPage() {
  const { user, profile, isAdmin, isSubscriptionActive, subscriptionTier, signOut, promoteToAdmin } =
    useAuth();
  const router = useRouter();

  const [adminSecretInput, setAdminSecretInput] = useState('');
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load live watch history from Firestore
  useEffect(() => {
    let active = true;
    if (!user) return;

    fetch(`/api/watch-history?userId=${user.uid}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.history) {
          setWatchHistory(data.history);
        }
      })
      .catch((err) => console.warn('Error loading dashboard watch history:', err))
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const refreshHistory = () => {
    if (!user) return;
    setLoadingHistory(true);
    fetch(`/api/watch-history?userId=${user.uid}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setWatchHistory(data.history);
      })
      .finally(() => setLoadingHistory(false));
  };

  const handleDeleteHistoryItem = async (videoId: string) => {
    if (!user) return;
    setWatchHistory((prev) => prev.filter((item) => item.videoId !== videoId));
    try {
      await fetch(`/api/watch-history?userId=${user.uid}&videoId=${videoId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Could not delete history item:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080b] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <User className="w-12 h-12 text-zinc-500 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Please Sign In</h2>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm">
            Sign in to view your profile, active subscriptions, and watch progress.
          </p>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-amber-600 shadow"
          >
            Go to Login
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const handlePromoteAdmin = async () => {
    setAdminLoading(true);
    setAdminMessage(null);
    const res = await promoteToAdmin(adminSecretInput);
    setAdminMessage(res.message);
    setAdminLoading(false);
  };

  const continueWatching = watchHistory.filter((i) => !i.completed && i.progressPercent > 1);
  const savedVideos = INITIAL_SEED_VIDEOS.slice(1, 4);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* User Profile Hero Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#12121c] via-[#161624] to-[#1a1215] border border-[#2b2b3d] shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-900 via-amber-700 to-yellow-600 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-[0_0_20px_rgba(212,175,55,0.4)] ring-2 ring-amber-500/30">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Welcome, {profile?.name || user.email?.split('@')[0]}
                  </h1>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isSubscriptionActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    Subscription: {isSubscriptionActive ? `${subscriptionTier.toUpperCase()} ACTIVE` : 'FREE PLAN'}
                  </span>

                  {isSubscriptionActive && profile?.subscriptionExpiry && (
                    <span className="text-xs text-zinc-400 font-mono">
                      Expires: {new Date(profile.subscriptionExpiry).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#181824] hover:bg-[#202030] text-zinc-200 border border-[#2c2c3e] transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Notification Settings
              </button>

              <Link
                href="/subscription"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 shadow"
              >
                {isSubscriptionActive ? 'Extend Plan' : 'Upgrade to VIP'}
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 transition-colors"
                >
                  Admin Portal
                </Link>
              )}

              <button
                onClick={() => signOut()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#181824] hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-[#2c2c3e] transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Active Subscription Privileges Card */}
        <div className="p-6 rounded-2xl bg-[#11111a] border border-[#232334] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e1e2c] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-black font-extrabold shadow">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Membership &amp; Cultivation Tier
                </h3>
                <p className="text-xs text-zinc-400">
                  {isSubscriptionActive
                    ? `Active ${subscriptionTier.toUpperCase()} Member with Unrestricted Streaming`
                    : 'Free Tier (Standard Definition, Ads enabled)'}
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 shadow shrink-0 self-start sm:self-auto"
            >
              {isSubscriptionActive ? 'Extend / Upgrade Plan' : 'Get VIP Pass (from ₹59)'}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#161622] border border-[#252536] space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Streaming Quality</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSubscriptionActive ? '4K UHD & 1080p' : 'Standard 720p'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161622] border border-[#252536] space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">VIP Episodes</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                {isSubscriptionActive ? 'Full Access' : 'Locked'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161622] border border-[#252536] space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Ad Experience</span>
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isSubscriptionActive ? '100% Ad-Free' : 'Standard Ads'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161622] border border-[#252536] space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Offline Downloads</span>
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                {isSubscriptionActive ? 'Enabled (Fast)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Promotion to Administrator Section */}
        {!isAdmin && (
          <div className="p-5 rounded-xl bg-[#11111a] border border-[#2b2b3d] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
              <Key className="w-4 h-4" />
              Administrative Verification & Promotion
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you are the platform owner, enter your master initialization secret (from .env.example / ADMIN_INITIAL_SECRET) to securely promote your account to the Administrator role:
            </p>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="password"
                value={adminSecretInput}
                onChange={(e) => setAdminSecretInput(e.target.value)}
                placeholder="Enter ADMIN_INITIAL_SECRET..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#181824] border border-[#2f2f42] text-white text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handlePromoteAdmin}
                disabled={adminLoading}
                className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition-colors"
              >
                {adminLoading ? 'Verifying...' : 'Promote to Admin'}
              </button>
            </div>
            {adminMessage && (
              <p className="text-xs font-semibold text-amber-300">{adminMessage}</p>
            )}
          </div>
        )}

        {/* User Watch History & Continue Watching Section */}
        <section id="history" className="space-y-4 pt-4 border-t border-[#1e1e2d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Your Watch History &amp; Progress</h2>
            </div>
            <button
              onClick={refreshHistory}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-8 rounded-2xl bg-[#101018] border border-[#232334] text-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
              <span className="text-xs text-zinc-400">Loading your history records...</span>
            </div>
          ) : watchHistory.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#101018] border border-[#232334] text-center space-y-3">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No watch history recorded yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Watch any episode in our catalog and your progress will automatically sync here across all your devices.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Browse Episodes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchHistory.map((item) => {
                const video = item.video;
                const minutesLeft = Math.max(1, Math.round((item.duration - item.progress) / 60));

                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-xl overflow-hidden bg-[#101018] border border-[#222233] group hover:border-amber-500/40 transition-all"
                  >
                    <div className="relative aspect-video w-full bg-zinc-900">
                      <Image
                        src={video?.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'}
                        alt={video?.title || 'Episode'}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <Link
                        href={`/watch/${item.videoId}`}
                        className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </Link>

                      {/* Top Action / Episode badge */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          Ep {video?.episodeNumber || 1}
                        </span>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.videoId)}
                          className="p-1 rounded bg-black/80 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-amber-500"
                          style={{ width: `${Math.min(100, Math.max(2, item.progressPercent || 0))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <div className="text-[11px] text-amber-400 font-medium truncate">
                          {video?.donghuaName || 'Decent Animation'}
                        </div>
                        <Link
                          href={`/watch/${item.videoId}`}
                          className="text-xs font-bold text-white hover:text-amber-400 line-clamp-1 transition-colors"
                        >
                          {video?.title || 'Episode'}
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                        <span>
                          {item.completed ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            `${minutesLeft} min left (${item.progressPercent}%)`
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(item.lastWatchedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Saved Bookmarks & Watchlist */}
        <section className="space-y-4 pt-4 border-t border-[#1e1e2d]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Saved Bookmarks &amp; Watchlist
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedVideos.map((vid) => (
              <VideoCard key={vid.id} video={vid} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
}
