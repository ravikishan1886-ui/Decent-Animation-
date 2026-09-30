'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getPlanUpgradeMessage, getUserPlan } from '@/lib/authorization';
import { Crown, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export function PersonalizedBanner() {
  const { user, profile, isAdmin } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPlan = isAdmin ? 'vip' : getUserPlan(profile);
  const msg = getPlanUpgradeMessage(currentPlan);

  const getTheme = () => {
    switch (currentPlan) {
      case 'vip':
        return {
          gradient: 'from-amber-950/60 via-[#1f1610] to-[#12121a]',
          border: 'border-amber-500/40',
          shadow: 'shadow-[0_0_20px_rgba(212,175,55,0.15)]',
          badgeText: 'VIP SUPREME ACCESS',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Crown className="w-5 h-5 text-amber-400" />,
        };
      case 'premium':
        return {
          gradient: 'from-purple-950/50 via-[#191322] to-[#12121a]',
          border: 'border-purple-600/40',
          shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
          badgeText: 'PREMIUM CULTIVATOR',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Sparkles className="w-5 h-5 text-purple-400" />,
        };
      case 'basic':
        return {
          gradient: 'from-blue-950/50 via-[#121724] to-[#12121a]',
          border: 'border-blue-600/40',
          shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
          badgeText: 'BASIC MEMBER',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
        };
      default:
        return {
          gradient: 'from-red-950/60 via-[#1f1014] to-[#12121a]',
          border: 'border-red-600/40',
          shadow: 'shadow-[0_0_20px_rgba(201,42,42,0.15)]',
          badgeText: 'FREE CULTIVATOR',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: <Crown className="w-5 h-5 text-red-400" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${theme.gradient} border ${theme.border} ${theme.shadow} relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-[#0e0e16] border border-[#242436] shrink-0 mt-0.5">
          {theme.icon}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${theme.badgeColor}`}
            >
              {theme.badgeText}
            </span>
            {mounted && user && (
              <span className="text-xs text-gray-400">
                Welcome, {profile?.name || user.displayName || user.email?.split('@')[0]}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-wide">
            {msg.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            {msg.subtitle}
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
        {currentPlan === 'vip' ? (
          <Link
            href="/browse"
            className="w-full md:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
          >
            <span>Browse Master Library</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/subscription"
            className="w-full md:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#c92a2a] via-rose-600 to-amber-600 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            <span>{msg.cta}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
