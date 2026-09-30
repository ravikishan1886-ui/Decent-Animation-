'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SubscriptionCountdown } from '@/components/SubscriptionCountdown';
import {
  User,
  Crown,
  Heart,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, subscriptionTier, isAdmin, signOut } = useAuth();
  const [name, setName] = useState<string>('');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setName(profile.username || profile.name || user?.displayName || '');
      setShowOnLeaderboard(profile.showOnLeaderboard !== false);
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: name.trim(),
          showOnLeaderboard,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setToast('Profile preferences saved successfully!');
      setTimeout(() => setToast(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          confirmationText: confirmText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete account');

      await signOut();
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Deletion error');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <User className="w-12 h-12 mx-auto text-gray-500" />
          <h2 className="text-xl font-bold text-white">Cultivator Account</h2>
          <p className="text-xs text-gray-400">Please log in to manage your profile and subscriptions.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="p-8 rounded-3xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-800 to-amber-700 flex items-center justify-center text-white text-2xl font-black ring-2 ring-amber-500/40 shadow-lg">
                {(profile?.username || profile?.name || user.email || 'C').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {profile?.username || profile?.name || user.displayName || user.email?.split('@')[0]}
                </h1>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 text-[10px] font-bold uppercase">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                    {profile?.plan || subscriptionTier || 'Free'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono">{user.email}</p>
              <p className="text-[10px] text-gray-500 font-mono">UID: {user.uid}</p>
              {profile?.createdAt && (
                <p className="text-[10px] text-gray-400 font-mono">
                  Joined: {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              )}
              {profile?.planExpiryDate && (
                <p className="text-[10px] text-amber-400 font-mono">
                  Plan Expires: {new Date(profile.planExpiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/subscription"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 shadow-md inline-flex items-center gap-1.5"
            >
              <Crown className="w-4 h-4" />
              <span>Manage Plan</span>
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-950/60 hover:bg-red-900 border border-red-800/60 shadow-md transition-all"
            >
              Log Out
            </button>
          </div>
        </div>

        {toast && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Subscription Live Status */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Membership Status &amp; Time Remaining
          </h3>
          <SubscriptionCountdown
            expiryDate={profile?.planExpiryDate || profile?.subscriptionExpiry}
            planId={profile?.planId || (typeof profile?.plan === 'string' ? profile.plan : undefined) || (typeof profile?.currentPlan === 'string' ? profile.currentPlan : undefined)}
            paymentSource={profile?.paymentSource || 'NONE'}
          />
        </div>

        {/* Badges & Super Chat stats */}
        <div className="p-6 rounded-3xl bg-[#12121a] border border-[#242436] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Patron Achievements &amp; Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#161624] border border-[#262638] space-y-1">
              <p className="text-xs text-gray-400">Total Super Chat Contributions</p>
              <p className="text-xl font-black text-pink-400 font-mono">
                ₹{profile?.superChatTotal || 0}
              </p>
              <Link href="/leaderboard" className="text-[11px] text-amber-400 font-bold hover:underline">
                View Cultivator Leaderboard →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#161624] border border-[#262638] space-y-2">
              <p className="text-xs text-gray-400">Unlocked Community Badges</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.badges || ['🗡️ Basic Cultivator']).map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-[#12121a] border border-[#242436] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Profile Settings
          </h3>

          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">
                Display Name / Cultivator Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2a2a3e] text-xs text-white"
              />
            </div>

            {/* Leaderboard visibility toggle */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-[#161624] border border-[#2a2a3e]">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Show on Public Leaderboard</p>
                <p className="text-[11px] text-gray-400">
                  Allow your username and badges to appear on the Top Cultivator Leaderboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
                className={`p-2 rounded-xl text-xs font-bold ${
                  showOnLeaderboard
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {showOnLeaderboard ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Delete Account
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-[#14141e] border border-red-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">Delete Account Permanently</h4>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                This will permanently delete your user profile, active subscriptions, and watch history from our servers. This action cannot be undone.
              </p>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Type <strong className="text-white">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#191924] border border-[#2b2b3d] text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting || confirmText !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
