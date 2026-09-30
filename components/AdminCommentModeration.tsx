'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CommentItem } from '@/lib/types';
import {
  MessageSquare,
  Pin,
  Trash2,
  Ban,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Heart,
  Crown,
} from 'lucide-react';

export function AdminCommentModeration() {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchComments = useCallback(async (query: string = '') => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/comments?query=${encodeURIComponent(query)}`, {
        headers: { 'x-admin-email': user.email },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.warn('Comment admin fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAction = async (action: string, commentId: string, targetUserId?: string) => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          commentId,
          targetUserId,
          adminEmail: user.email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(data.message || 'Comment moderation applied!');
        setTimeout(() => setToast(null), 3000);
        fetchComments(searchQuery);
      }
    } catch (e) {
      console.warn('Moderation error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search comments by text or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181826] border border-[#2c2c3e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => fetchComments(searchQuery)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#181826] text-gray-300 hover:text-white border border-[#2c2c3e] flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl bg-[#12121a] border border-[#242436] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#181826] border-b border-[#242438] text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Author</th>
                <th className="p-4">Comment Content</th>
                <th className="p-4">Episode ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading comments for moderation...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No comments found.
                  </td>
                </tr>
              ) : (
                comments.map((c) => (
                  <tr key={c.id} className="hover:bg-[#161622] transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white">@{c.username}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{c.userId}</p>
                      </div>
                    </td>

                    <td className="p-4 max-w-md">
                      <p className="text-gray-200 line-clamp-2 leading-relaxed">{c.content}</p>
                    </td>

                    <td className="p-4 font-mono text-gray-400 text-[11px]">{c.videoId}</td>

                    <td className="p-4">
                      {c.isPinned ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          PINNED
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Normal</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleAction(c.isPinned ? 'UNPIN' : 'PIN', c.id)
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#1a1a28] text-amber-400 border border-[#2a2a3e] hover:bg-[#222234]"
                        >
                          {c.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => handleAction('DELETE', c.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleAction('BAN_USER', c.id, c.userId)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700 hover:bg-zinc-800"
                        >
                          Mute User
                        </button>
                      </div>
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
