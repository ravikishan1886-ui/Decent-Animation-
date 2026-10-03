'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserProfile } from '@/lib/types';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  UserCheck,
  MessageSquareOff,
  Trash2,
} from 'lucide-react';

export function AdminUserManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
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
          targetUserId: selectedUser.userId || selectedUser.uid,
          adminEmail: user.email,
          role: selectedRole,
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
                <th className="p-4">Cultivator</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading cultivator records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No cultivators match the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdminRole = u.role === 'admin';
                  const isMuted = Boolean(u.commentingBanned);

                  return (
                    <tr key={u.userId || u.uid} className="hover:bg-[#161622] transition-colors">
                      {/* User details */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-sm">
                            {u.username || u.name || 'Cultivator'}
                          </p>
                          <p className="text-gray-400 font-mono text-[11px]">{u.email}</p>
                          <p className="text-gray-600 font-mono text-[9px]">UID: {u.userId || u.uid}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isAdminRole
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {isAdminRole ? 'Admin' : 'Cultivator'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">
                            Active (Free)
                          </span>
                          {isMuted && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700">
                              Muted
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="p-4 font-mono text-gray-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedRole(isAdminRole ? 'user' : 'admin');
                              setActionType('CHANGE_ROLE');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isAdminRole
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                                : 'bg-red-950/60 text-red-300 border-red-800/60 hover:bg-red-900/60'
                            }`}
                          >
                            {isAdminRole ? 'Demote to User' : 'Promote Admin'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('TOGGLE_MUTE');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isMuted
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                            }`}
                          >
                            {isMuted ? 'Unmute' : 'Mute Comments'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('DELETE_USER');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40"
                          >
                            Delete
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
                {actionType === 'CHANGE_ROLE'
                  ? 'Update Role'
                  : actionType === 'TOGGLE_MUTE'
                  ? 'Moderation Privileges'
                  : 'Delete Cultivator'}
                {' • '}
                {selectedUser.username || selectedUser.email}
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
            {actionType === 'CHANGE_ROLE' && (
              <div className="space-y-3">
                <label className="text-xs text-gray-300 block">Select User Role:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                >
                  <option value="user">Standard Cultivator (User)</option>
                  <option value="admin">Platform Administrator (Admin)</option>
                </select>
              </div>
            )}

            {actionType === 'TOGGLE_MUTE' && (
              <p className="text-xs text-amber-200 leading-relaxed">
                {selectedUser.commentingBanned
                  ? `Restore commenting privileges for @${selectedUser.username || selectedUser.email}?`
                  : `Temporarily mute @${selectedUser.username || selectedUser.email} from posting comments on videos and reels?`}
              </p>
            )}

            {actionType === 'DELETE_USER' && (
              <p className="text-xs text-red-300 leading-relaxed">
                Are you sure you want to permanently delete user @{selectedUser.username || selectedUser.email} from the database? This action cannot be undone.
              </p>
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
