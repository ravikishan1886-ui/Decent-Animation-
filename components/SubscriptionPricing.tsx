'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle2, Film, Compass, ShieldCheck } from 'lucide-react';

export function SubscriptionPricing() {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <Sparkles className="w-3.5 h-3.5" />
          100% Free Streaming Sanctuary
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight">
          No Plans. No Payments. Completely Free.
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Decent Animation is fully open to all cultivators. Enjoy uninterrupted access to Chinese animation, 1080p master dubs, offline downloads, and vertical short reels with zero fees.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#12121c] to-[#0c0c12] border border-[#242436] shadow-2xl space-y-6 text-left max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          What&apos;s Included For Everyone:
        </h2>
        <ul className="space-y-3.5 text-sm text-gray-300">
          <li className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Full streaming access to all Chinese animation series and movies</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>High-definition Hindi dubbed and English subtitled episodes</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Dedicated vertical short video feed (Reels) with likes, comments, and saves</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Interactive community live chat, polls, and watch progress syncing</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero hidden charges, recurring mandates, or payment cards required</span>
          </li>
        </ul>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            href="/browse"
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Browse All Series
          </Link>
          <Link
            href="/reels"
            className="flex-1 py-3 px-5 rounded-xl bg-[#1a1a28] hover:bg-[#252538] text-white font-bold text-xs sm:text-sm text-center border border-[#303046] transition-all flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4 text-amber-400" />
            Watch Reels Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
