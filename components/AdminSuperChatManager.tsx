'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SuperChatItem } from '@/lib/types';
import { Heart, DollarSign, Calendar, RefreshCw, Trophy, Crown } from 'lucide-react';

export function AdminSuperChatManager() {
  const { user } = useAuth();
  const [superChats, setSuperChats] = useState<SuperChatItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSuperChats = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/superchats', {
        headers: { 'x-admin-email': user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setSuperChats(data.superChats || []);
        setTotalRevenue(data.totalRevenue || 0);
      }
    } catch (e) {
      console.warn('Superchat admin fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchSuperChats();
  }, [fetchSuperChats]);

  return (
    <div className="space-y-6">
      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] space-y-1">
          <p className="text-xs text-gray-400 uppercase font-mono">Total Super Chat Volume</p>
          <p className="text-2xl font-black text-emerald-400 font-mono">₹{totalRevenue}</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] space-y-1">
          <p className="text-xs text-gray-400 uppercase font-mono">Total Transactions</p>
          <p className="text-2xl font-black text-amber-400 font-mono">{superChats.length}</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] space-y-1">
          <p className="text-xs text-gray-400 uppercase font-mono">Top Contributor</p>
          <p className="text-sm font-bold text-white truncate">
            {superChats[0] ? `@${superChats[0].username} (₹${superChats[0].amount})` : 'None yet'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#12121a] border border-[#242436] overflow-hidden shadow-xl">
        <div className="p-4 bg-[#181826] border-b border-[#242438] flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            Super Chat Contributions &amp; Ledger
          </h4>
          <button
            onClick={fetchSuperChats}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#181826] border-b border-[#242438] text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Cultivator</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Honorary Badge</th>
                <th className="p-4">Message</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading contributions...
                  </td>
                </tr>
              ) : superChats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No Super Chat contributions recorded yet.
                  </td>
                </tr>
              ) : (
                superChats.map((sc) => (
                  <tr key={sc.id} className="hover:bg-[#161622] transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white">@{sc.username}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{sc.userEmail}</p>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{sc.amount}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        {sc.badgeLevel}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      <p className="text-gray-200 line-clamp-2">{sc.message}</p>
                    </td>

                    <td className="p-4 font-mono uppercase text-gray-400 text-[11px]">
                      {sc.targetType}
                    </td>

                    <td className="p-4 font-mono text-[10px] text-gray-500">
                      {sc.paymentId || 'N/A'}
                    </td>

                    <td className="p-4 text-gray-400 text-[11px] whitespace-nowrap">
                      {new Date(sc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
