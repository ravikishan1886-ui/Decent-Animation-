'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserProfile } from '@/lib/types';
import {
  Users,
  Search,
  Crown,
  Calendar,
  ShieldCheck,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  X,
  Sparkles,
} from 'lucide-react';

export function AdminUserManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('vip');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [extendDays, setExtendDays] = useState<number>(30);
  const [banReason, setBanReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (query: string = '') => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/users?query=${encodeURIComponent(query)}&adminEmail=${encodeURIComponent(user.email || '')}`,
        {
          headers: {
            'x-admin-email': user.email || '',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.warn('Admin user fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleExecuteAction = async () => {
    if (!selectedUser || !user?.email) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          targetUserId: selectedUser.userId,
          adminEmail: user.email,
          plan: selectedPlan,
          role: selectedRole,
          customExpiryDate: customExpiryDate || undefined,
          days: extendDays,
          reason: banReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setToastMessage(data.message || 'Operation executed successfully!');
      setTimeout(() => setToastMessage(null), 4000);
      setSelectedUser(null);
      setActionType('');
      fetchUsers(searchQuery);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search Controls */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Username, Email, or User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181826] border border-[#2c2c3e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchUsers(searchQuery)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#181826] text-gray-300 hover:text-white border border-[#2c2c3e] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl bg-[#12121a] border border-[#242436] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#181826] border-b border-[#242438] text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Current Plan</th>
                <th className="p-4">Sub Status</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Super Chat</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading cultivator records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isVip = u.currentPlan === 'vip' || u.planId === 'vip';
                  const isPremium = u.currentPlan === 'premium' || u.planId === 'premium';
                  const isActive = u.subscriptionStatus === 'active';

                  return (
                    <tr key={u.userId} className="hover:bg-[#161622] transition-colors">
                      {/* User details */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-sm">
                            {u.username || u.name || 'Cultivator'}
                          </p>
                          <p className="text-gray-400 font-mono text-[11px]">{u.email}</p>
                          <p className="text-gray-600 font-mono text-[9px]">ID: {u.userId}</p>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isVip
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isPremium
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {u.currentPlan || u.planId || 'Free'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {u.subscriptionStatus || 'Inactive'}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="p-4 font-mono text-gray-300 text-[11px]">
                        {u.subscriptionExpiry
                          ? new Date(u.subscriptionExpiry).toLocaleDateString()
                          : '—'}
                      </td>

                      {/* Super chat total */}
                      <td className="p-4 font-mono font-bold text-emerald-400">
                        ₹{u.superChatTotal || 0}
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#202030] text-gray-300">
                          {u.role || 'user'}
                        </span>
                        {u.commentingBanned && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[9px] font-bold">
                            Muted
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('GIVE_PLAN');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/40"
                          >
                            Give Plan
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('CHANGE_PLAN');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/40"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('EXTEND_DAYS');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40"
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('REMOVE_PLAN');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedRole(u.role === 'admin' ? 'admin' : 'user');
                              setActionType('CHANGE_ROLE');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:bg-purple-800/60"
                          >
                            Role
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('SET_EXPIRY');
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-800/60"
                          >
                            Date
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#14141e] border border-[#2e2e42] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242436] pb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {actionType.replace('_', ' ')} • {selectedUser.username || selectedUser.email}
              </h4>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Based on Action */}
            {(actionType === 'GIVE_PLAN' || actionType === 'CHANGE_PLAN') && (
              <div className="space-y-3">
                <label className="text-xs text-gray-300 block">Select Subscription Plan:</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                >
                  <option value="free">Free Tier (₹0)</option>
                  <option value="basic-monthly">Basic Monthly (₹59/mo)</option>
                  <option value="basic-quarterly">Basic Quarterly (₹159/3mo)</option>
                  <option value="basic-yearly">Basic Yearly (₹549/yr)</option>
                  <option value="premium-monthly">Premium Monthly (₹99/mo - Popular)</option>
                  <option value="premium-quarterly">Premium Quarterly (₹269/3mo)</option>
                  <option value="premium-yearly">Premium Yearly (₹899/yr)</option>
                  <option value="vip-monthly">VIP Monthly (₹149/mo)</option>
                  <option value="vip-quarterly">VIP Quarterly (₹399/3mo)</option>
                  <option value="vip-yearly">VIP Yearly (₹1,299/yr)</option>
                </select>
              </div>
            )}

            {(actionType === 'EXTEND_DAYS' || actionType === 'EXTEND_PLAN') && (
              <div className="space-y-3">
                <label className="text-xs text-gray-300 block font-semibold">Extend Plan Duration:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExtendDays(30)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      extendDays === 30
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#181824] text-gray-300 border-[#2b2b3d] hover:bg-[#202030]'
                    }`}
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(90)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      extendDays === 90
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#181824] text-gray-300 border-[#2b2b3d] hover:bg-[#202030]'
                    }`}
                  >
                    +90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(365)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      extendDays === 365
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#181824] text-gray-300 border-[#2b2b3d] hover:bg-[#202030]'
                    }`}
                  >
                    +365 Days
                  </button>
                </div>
                <div className="pt-1">
                  <label className="text-[11px] text-gray-400 block mb-1">Custom Days:</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {(actionType === 'CANCEL_PLAN' || actionType === 'REMOVE_PLAN') && (
              <p className="text-xs text-red-300 leading-relaxed">
                Are you sure you want to remove and expire this user's active membership plan?
              </p>
            )}

            {actionType === 'CHANGE_ROLE' && (
              <div className="space-y-3">
                <label className="text-xs text-gray-300 block">Select User Role:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            {actionType === 'SET_EXPIRY' && (
              <div className="space-y-3">
                <label className="text-xs text-gray-300 block">Set Plan Expiry Date:</label>
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setActionType('');
                }}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40"
              >
                {actionLoading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
