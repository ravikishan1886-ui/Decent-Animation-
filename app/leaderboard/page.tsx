'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/lib/auth-context';
import { LeaderboardEntry } from '@/lib/types';
import {
  Trophy,
  Crown,
  Heart,
  Flame,
  Sparkles,
  Shield,
  Medal,
  Award,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = useCallback(async (selectedTimeframe: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?timeframe=${selectedTimeframe}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.warn('Leaderboard fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe, fetchLeaderboard]);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Heavenly Cultivator Hall of Fame</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Top Cultivators &amp; Benefactors
          </h1>

          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Honoring the grand patrons and cultivators who support Decent Animation Hindi Dub releases through Super Chat and active participation.
          </p>

          {/* Timeframe Filter Tabs */}
          <div className="pt-2 flex items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All-Time Legends' },
              { id: 'monthly', label: 'This Month' },
              { id: 'weekly', label: 'This Week' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeframe === tab.id
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                    : 'bg-[#141420] text-gray-400 hover:text-white border border-[#242436]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Podium for Top 3 Cultivators */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            {/* Rank 2 */}
            {topThree[1] && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181826] to-[#12121c] border border-slate-500/40 text-center space-y-3 relative shadow-xl order-2 md:order-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-slate-500/30 text-slate-300 flex items-center justify-center font-bold text-xs font-mono">
                  #2
                </div>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 flex items-center justify-center text-white text-lg font-black shadow-lg">
                  {topThree[1].username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">@{topThree[1].username}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 font-semibold font-mono">
                    {topThree[1].badgeLevel}
                  </span>
                </div>
                <p className="text-lg font-black font-mono text-emerald-400">
                  ₹{topThree[1].superChatTotal}
                </p>
              </div>
            )}

            {/* Rank 1 (Center, Elevated) */}
            {topThree[0] && (
              <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#1a161e] to-[#12121c] border border-amber-500/60 text-center space-y-4 relative shadow-[0_0_30px_rgba(212,175,55,0.25)] order-1 md:order-2 md:-translate-y-4">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center justify-center font-bold text-sm font-mono">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-black text-2xl font-black shadow-2xl ring-4 ring-amber-500/30">
                  {topThree[0].username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">@{topThree[0].username}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono">
                    {topThree[0].badgeLevel}
                  </span>
                </div>
                <p className="text-2xl font-black font-mono text-amber-400">
                  ₹{topThree[0].superChatTotal}
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-amber-300/80">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Supreme Sect Benefactor</span>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181826] to-[#12121c] border border-amber-800/40 text-center space-y-3 relative shadow-xl order-3">
                <div className="w-8 h-8 mx-auto rounded-full bg-amber-800/30 text-amber-300 flex items-center justify-center font-bold text-xs font-mono">
                  #3
                </div>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                  {topThree[2].username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">@{topThree[2].username}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-300 font-semibold font-mono">
                    {topThree[2].badgeLevel}
                  </span>
                </div>
                <p className="text-lg font-black font-mono text-emerald-400">
                  ₹{topThree[2].superChatTotal}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="rounded-3xl bg-[#12121a] border border-[#242436] overflow-hidden shadow-2xl">
          <div className="p-5 bg-[#181826] border-b border-[#242438] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-400" />
              Cultivator Rankings
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              Live automated calculations
            </span>
          </div>

          <div className="divide-y divide-[#1e1e2e]">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 font-mono">
                Calculating Dao contribution ranks...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No cultivators on the leaderboard yet. Send a Super Chat on any episode to claim the #1 spot!
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-[#161624] ${
                    user?.uid === entry.userId ? 'bg-amber-950/20 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-mono font-bold text-sm text-gray-400 text-center">
                      #{entry.rank}
                    </span>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-900 to-amber-700 flex items-center justify-center text-white font-bold text-xs">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">@{entry.username}</span>
                        {user?.uid === entry.userId && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1e2e] text-gray-300 font-mono">
                        {entry.badgeLevel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-black text-sm text-emerald-400">
                      ₹{entry.superChatTotal}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {entry.superChatCount} contributions
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
