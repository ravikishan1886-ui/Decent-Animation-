'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, ArrowRight, Film, Compass } from 'lucide-react';

export function PersonalizedBanner() {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/60 via-[#1a121d] to-[#0e0e16] border border-red-700/40 shadow-[0_0_25px_rgba(201,42,42,0.2)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-[#0e0e16] border border-[#242436] shrink-0 mt-0.5 shadow-inner">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              100% FREE STREAMING
            </span>
            {mounted && user && (
              <span className="text-xs text-gray-400">
                Welcome back, {profile?.name || user.displayName || user.email?.split('@')[0]}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-wide">
            Unlimited Chinese Animation &amp; Donghua Epics
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            All episodes, 1080p master dubs, and vertical video short reels are completely free. No subscription plans or credit cards required.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
        <Link
          href="/reels"
          className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1a1a28] hover:bg-[#252538] border border-[#303046] transition-all flex items-center justify-center gap-2"
        >
          <Film className="w-4 h-4 text-amber-400" />
          <span>Watch Reels</span>
        </Link>
        <Link
          href="/browse"
          className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
        >
          <Compass className="w-4 h-4" />
          <span>Browse All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
