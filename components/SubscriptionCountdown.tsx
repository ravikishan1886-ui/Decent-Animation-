'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSubscriptionCountdown } from '@/lib/authorization';
import { Clock, Crown, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface SubscriptionCountdownProps {
  expiryDate?: string | null;
  planId?: string | null;
  paymentSource?: string | null;
  showRenewalButton?: boolean;
}

export function SubscriptionCountdown({
  expiryDate,
  planId,
  paymentSource,
  showRenewalButton = true,
}: SubscriptionCountdownProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(() => getSubscriptionCountdown(expiryDate));

  useEffect(() => {
    setMounted(true);
    setCountdown(getSubscriptionCountdown(expiryDate));
    const timer = setInterval(() => {
      setCountdown(getSubscriptionCountdown(expiryDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl bg-[#14141e] border border-[#262638] animate-pulse h-24" />
    );
  }

  if (!expiryDate) {
    return (
      <div className="p-4 rounded-2xl bg-[#14141e] border border-[#262638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400">Current Membership Status</p>
          <p className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>Free Cultivator Tier</span>
            <span className="text-[10px] text-gray-500 font-mono">(No active expiry)</span>
          </p>
        </div>
        {showRenewalButton && (
          <Link
            href="/subscription"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#c92a2a] to-amber-600 hover:brightness-110 transition-all shadow-md inline-flex items-center gap-1.5 w-fit"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade Plan
          </Link>
        )}
      </div>
    );
  }

  if (countdown.expired) {
    return (
      <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-red-300 font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Subscription Expired on {countdown.expiryString}
          </p>
          <p className="text-xs text-gray-300">
            Renew now to restore 1080p/4K streaming and offline episode downloads.
          </p>
        </div>
        {showRenewalButton && (
          <Link
            href="/subscription"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md inline-flex items-center gap-1.5 w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Renew Subscription
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#17141f] via-[#141422] to-[#12121a] border border-amber-500/30 shadow-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Membership Expiry
              </h4>
              {paymentSource === 'ADMIN_GRANTED' && (
                <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[9px] font-bold uppercase">
                  Admin Granted
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Valid until <strong>{countdown.expiryString}</strong>
            </p>
          </div>
        </div>

        {showRenewalButton && (
          <Link
            href="/subscription"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-[#1c1c2b] hover:bg-[#252538] border border-amber-500/40 transition-all inline-flex items-center gap-1.5 w-fit"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Extend / Upgrade
          </Link>
        )}
      </div>

      {/* Numerical Countdown Blocks */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="p-2 rounded-xl bg-[#0f0f18] border border-[#222234]">
          <p className="text-base sm:text-lg font-black text-amber-400 font-mono leading-none">
            {countdown.days}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Days</p>
        </div>
        <div className="p-2 rounded-xl bg-[#0f0f18] border border-[#222234]">
          <p className="text-base sm:text-lg font-black text-white font-mono leading-none">
            {countdown.hours}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Hours</p>
        </div>
        <div className="p-2 rounded-xl bg-[#0f0f18] border border-[#222234]">
          <p className="text-base sm:text-lg font-black text-white font-mono leading-none">
            {countdown.minutes}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Minutes</p>
        </div>
        <div className="p-2 rounded-xl bg-[#0f0f18] border border-[#222234]">
          <p className="text-base sm:text-lg font-black text-red-400 font-mono leading-none">
            {countdown.seconds}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Secs</p>
        </div>
      </div>
    </div>
  );
}
