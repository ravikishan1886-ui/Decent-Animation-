'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SuperChatItem } from '@/lib/types';
import {
  Heart,
  Crown,
  Sparkles,
  DollarSign,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface SuperChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'video' | 'live';
  onSuccess?: (superChat: SuperChatItem) => void;
}

const PRESET_TIERS = [
  { amount: 50, label: 'Patron Blessing', badge: 'Patron', color: 'from-amber-700 to-amber-900', border: 'border-amber-700' },
  { amount: 100, label: 'Dao Disciple', badge: 'Disciple', color: 'from-blue-600 to-indigo-900', border: 'border-blue-500' },
  { amount: 200, label: 'Immortal Warrior', badge: 'Warrior', color: 'from-purple-600 to-violet-900', border: 'border-purple-500' },
  { amount: 500, label: 'Grand Elder', badge: 'Grand Elder', color: 'from-rose-600 to-red-950', border: 'border-rose-500' },
  { amount: 1000, label: 'Sect Master', badge: 'Sect Master', color: 'from-amber-500 to-yellow-600', border: 'border-amber-400' },
];

export function SuperChatModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  onSuccess,
}: SuperChatModalProps) {
  const { user, profile } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuperChatItem | null>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleSelectTier = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
  };

  const verifySuperChat = async (response: any, verifiedAmount: number) => {
    try {
      const verifyRes = await fetch('/api/superchat/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...response,
          userId: user?.uid,
          userEmail: user?.email,
          username: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Cultivator',
          amount: verifiedAmount,
          message: message.trim(),
          targetId,
          targetType,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Super Chat verification failed');
      }

      setSuccessData(verifyData.superChat);
      if (onSuccess) onSuccess(verifyData.superChat);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to send a Super Chat');
      return;
    }

    if (currentAmount < 10) {
      setError('Minimum Super Chat amount is ₹10');
      return;
    }

    if (!message.trim()) {
      setError('Please write a message to display with your Super Chat');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch('/api/superchat/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          targetId,
          targetType,
          message: message.trim(),
          userId: user.uid,
          userEmail: user.email,
          username: profile?.name || user.displayName || user.email?.split('@')[0] || 'Cultivator',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize order');
      }

      const hasRazorpay = typeof window !== 'undefined' && (window as any).Razorpay;

      if (hasRazorpay && orderData.keyId && orderData.keyId !== 'rzp_test_placeholder') {
        const options = {
          key: orderData.keyId,
          amount: orderData.amountInPaise,
          currency: 'INR',
          name: 'Decent Animation',
          description: `Super Chat for ${targetType}: ₹${orderData.amount}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            await verifySuperChat(response, orderData.amount);
          },
          prefill: {
            name: profile?.name || user.displayName || 'Cultivator',
            email: user.email || '',
          },
          theme: { color: '#c92a2a' },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct simulation fallback
        const simulatedPaymentId = 'sim_pay_' + orderData.orderId;
        await verifySuperChat(
          {
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: simulatedPaymentId,
            razorpay_signature: 'sim_sig_valid',
          },
          orderData.amount
        );
      }
    } catch (err: any) {
      console.error('Superchat error:', err);
      setError(err.message || 'Payment processing encountered an issue');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#12121c] border border-amber-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#1c1c28] text-gray-400 hover:text-white hover:bg-[#252535] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-pink-500">
            <Heart className="w-5 h-5 fill-pink-500" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">
              Empower Decent Animation
            </span>
          </div>
          <h3 className="text-2xl font-black text-white font-serif tracking-tight">
            Send Super Chat &amp; Rank Up
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your message will be pinned with an honorary badge and count toward your Cultivator Leaderboard ranking.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Super Chat Delivered!</h4>
              <p className="text-xs text-gray-300">
                Thank you, Cultivator! You contributed <strong className="text-amber-400 font-mono">₹{successData.amount}</strong>.
              </p>
              <p className="text-[11px] text-gray-400">
                Honorary Badge: <strong className="text-amber-300">{successData.badgeLevel}</strong>
              </p>
            </div>

            <button
              onClick={() => {
                setSuccessData(null);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg"
            >
              Continue Watching
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-5">
            {/* Amount Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                Select Cultivation Contribution Tier:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_TIERS.map((tier) => {
                  const isSelected = !customAmount && selectedAmount === tier.amount;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => handleSelectTier(tier.amount)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? `bg-gradient-to-br ${tier.color} text-white ${tier.border} shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-[1.02]`
                          : 'bg-[#181826] border-[#2c2c3e] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <p className="font-mono font-black text-sm">₹{tier.amount}</p>
                      <p className="text-[10px] font-semibold opacity-90 truncate">{tier.label}</p>
                      {isSelected && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}

                {/* Custom Amount */}
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    placeholder="Custom ₹"
                    value={customAmount}
                    onChange={handleCustomChange}
                    className={`w-full h-full p-3 rounded-2xl bg-[#181826] border text-xs font-mono font-bold text-white placeholder:text-gray-500 focus:outline-none transition-all ${
                      customAmount
                        ? 'border-amber-500 bg-amber-950/30'
                        : 'border-[#2c2c3e] focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 block">
                Super Chat Message (Displayed &amp; Highlighted):
              </label>
              <textarea
                rows={3}
                required
                maxLength={200}
                placeholder="Write your words of support for Decent Animation Hindi Dub..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#181826] border border-[#2c2c3e] text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Supports Razorpay Cards, UPI, Netbanking</span>
                <span>{message.length} / 200</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || currentAmount < 10}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Send Super Chat (₹{currentAmount})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
