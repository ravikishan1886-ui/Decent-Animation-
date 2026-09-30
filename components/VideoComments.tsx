'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CommentItem } from '@/lib/types';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Heart,
  Crown,
  Send,
  Trash2,
  AlertCircle,
  Sparkles,
  Shield,
} from 'lucide-react';

interface VideoCommentsProps {
  videoId: string;
}

export function VideoComments({ videoId }: VideoCommentsProps) {
  const { user, profile, subscriptionTier, isAdmin } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (page: number = 1) => {
    if (!videoId) return;
    try {
      const res = await fetch(`/api/comments?videoId=${videoId}&page=${page}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotalCount(data.total || (data.comments || []).length);
      }
    } catch (e) {
      console.warn('Comments fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      fetchComments(1);
    }
  }, [videoId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to participate in the cultivation discussion.');
      return;
    }
    if (!inputText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          userId: user.uid,
          userEmail: user.email,
          username: profile?.name || user.displayName || user.email?.split('@')[0] || 'Cultivator',
          profileImage: profile?.profileImage || '',
          content: inputText.trim(),
          userPlan: isAdmin ? 'vip' : subscriptionTier || 'free',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      setInputText('');
      fetchComments(1);
    } catch (err: any) {
      setError(err.message || 'Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, type: 'up' | 'down') => {
    if (!user) {
      setError('Please log in to like/dislike comments.');
      return;
    }

    try {
      const res = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId: user.uid, type }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, ...data.comment } : c))
        );
      }
    } catch (e) {
      console.warn('Vote error:', e);
    }
  };

  const handleAdminAction = async (action: string, commentId: string) => {
    if (!user?.email || !isAdmin) return;

    try {
      const res = await fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, commentId, adminEmail: user.email }),
      });

      if (res.ok) {
        fetchComments(1);
      }
    } catch (e) {
      console.warn('Admin action error:', e);
    }
  };

  return (
    <div className="rounded-3xl bg-[#101018] border border-[#202030] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#202030] pb-4">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">Cultivator Discussion</h3>
          <span className="text-xs text-gray-400 font-mono">({totalCount} comments)</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* New Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-900 to-amber-700 flex items-center justify-center text-white text-xs font-bold ring-1 ring-amber-500/30 shrink-0 mt-1">
              {(profile?.name || user.email || 'C').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                placeholder="Share your insights on this cultivation breakthrough..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#161624] border border-[#2c2c3e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  {subscriptionTier === 'vip' && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> VIP Cultivator Badge
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || !inputText.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-[#161624] border border-[#28283a] text-center text-xs text-gray-400 space-y-2">
          <p>Please log in to leave comments and join the community discussion.</p>
          <a
            href={`/login?redirect=/watch/${videoId}`}
            className="inline-block px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
          >
            Log In to Comment
          </a>
        </div>
      )}

      {/* Comment Thread List */}
      <div className="space-y-4 pt-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 font-mono">
            Loading comments from Dao realm...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Be the first cultivator to leave a comment!
          </div>
        ) : (
          comments.map((c) => {
            const isVip = c.userPlan === 'vip';
            const isSuper = Boolean(c.isSuperChat);

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl transition-all space-y-2.5 ${
                  c.isPinned
                    ? 'bg-amber-950/30 border border-amber-500/50 shadow-md'
                    : isSuper
                    ? 'bg-gradient-to-r from-red-950/40 to-amber-950/40 border border-amber-600/40 shadow-sm'
                    : 'bg-[#141420] border border-[#222234]'
                }`}
              >
                {/* Pin Header if Pinned */}
                {c.isPinned && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <Pin className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Pinned by Admin</span>
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-900 to-amber-700 flex items-center justify-center text-white text-[11px] font-bold">
                      {c.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs text-white">@{c.username}</span>

                    {isVip && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/30 to-amber-700/30 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                        VIP
                      </span>
                    )}

                    {c.badge && !isVip && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300">
                        {c.badge}
                      </span>
                    )}

                    {isSuper && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-black flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-400" />
                        Super Chat
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(c.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Content */}
                <p className="text-xs text-gray-300 leading-relaxed break-words pl-9">
                  {c.content}
                </p>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pl-9 pt-1 text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVote(c.id, 'up')}
                      className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{c.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => handleVote(c.id, 'down')}
                      className="flex items-center gap-1 hover:text-red-400 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{c.dislikes || 0}</span>
                    </button>
                  </div>

                  {/* Admin Moderation Controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleAdminAction(c.isPinned ? 'UNPIN' : 'PIN', c.id)
                        }
                        className="text-[10px] text-amber-400 hover:underline"
                      >
                        {c.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => handleAdminAction('DELETE', c.id)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
