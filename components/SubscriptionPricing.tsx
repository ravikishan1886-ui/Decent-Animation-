'use client';

import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS, PlanConfig, PlanDuration } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Check, Crown, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

interface SubscriptionPricingProps {
  onSuccess?: () => void;
}

export function SubscriptionPricing({ onSuccess }: SubscriptionPricingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PlanDuration>('monthly');
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { user, profile, isSubscriptionActive } = useAuth();
  const router = useRouter();

  const filteredPlans = SUBSCRIPTION_PLANS.filter((p) => p.period === selectedPeriod);

  const handleOpenCheckout = (plan: PlanConfig) => {
    if (!user) {
      router.push(`/login?redirect=/subscription&plan=${plan.id}`);
      return;
    }
    setErrorMessage(null);
    setActiveCheckoutPlan(plan);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setSuccessMessage('Your subscription has been activated successfully! Enjoy VIP Donghua content.');
    if (onSuccess) onSuccess();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header & Description */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Cultivator Immersion Tiers
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-serif">
          Unlock Unlimited <span className="text-[#c92a2a] gold-text-glow">Donghua</span> Sagas
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Stream in stunning 4K &amp; 1080p, unlock early-access VIP episodes, enjoy Hindi dubs, and download for offline viewing. No automated recurring card charges.
        </p>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="mb-8 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Duration Period Selector Tabs */}
      <div className="flex justify-center mb-10">
        <div className="p-1.5 rounded-xl bg-[#12121a] border border-[#232332] flex items-center space-x-1 shadow-inner">
          {(['monthly', 'quarterly', 'yearly'] as PlanDuration[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-[#c92a2a] to-amber-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a24]'
              }`}
            >
              {period === 'monthly' && 'Monthly'}
              {period === 'quarterly' && 'Quarterly (3 Months)'}
              {period === 'yearly' && 'Yearly (Best Value)'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {filteredPlans.map((plan) => {
          const isCurrent = profile?.planId === plan.id && isSubscriptionActive;
          const isVip = plan.tier === 'vip';

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                plan.highlight
                  ? 'bg-[#14141e] border-2 border-amber-500/60 shadow-[0_0_35px_rgba(212,175,55,0.18)]'
                  : 'bg-[#101017] border border-[#252536] hover:border-gray-500'
              }`}
            >
              {/* Top Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg">
                  {plan.badge}
                </div>
              )}

              {/* Plan Title & Tier */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {isVip && <Crown className="w-5 h-5 text-amber-400" />}
                    {plan.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wide">
                    {plan.tier} Access Tier
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                  ₹{plan.price}
                </span>
                <span className="text-sm font-medium text-gray-400">{plan.durationLabel}</span>
              </div>

              {/* Feature Checklist */}
              <ul className="my-6 space-y-3 flex-1 border-t border-b border-[#20202e] py-6">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isCurrent ? (
                <div className="w-full py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-center font-bold text-sm flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Current Active Plan
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(plan)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#c92a2a] via-[#e03131] to-amber-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(201,42,42,0.4)]'
                      : 'bg-[#222232] hover:bg-[#2b2b3f] text-gray-100 border border-[#333347]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Subscribe for ₹{plan.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Payment & Checkout Modal */}
      {activeCheckoutPlan && (
        <PaymentCheckoutModal
          plan={activeCheckoutPlan}
          isOpen={Boolean(activeCheckoutPlan)}
          onClose={() => setActiveCheckoutPlan(null)}
          onSuccess={(paymentId) => {
            handlePaymentSuccess(paymentId);
          }}
        />
      )}

      {/* Security & Indian Payment Gateway Notice */}
      <div className="mt-12 p-6 rounded-2xl bg-[#0f0f16] border border-[#222230] max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-400">
        <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-1">
            Safe &amp; Direct Indian Checkout (UPI / Cards / NetBanking)
          </h4>
          <p className="leading-relaxed">
            All subscriptions are processed through Razorpay India with server-side signature validation. No hidden automatic renewals. Your payment directly activates verified cloud privileges in your account.
          </p>
        </div>
      </div>
    </div>
  );
}
