'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReelCommentItem } from '@/lib/types';
import { fetchReelComments, postReelComment } from '@/lib/reel-service';
import { useAuth } from '@/lib/auth-context';
import { X, Send, MessageSquare, Crown, Lock, Heart } from 'lucide-react';

interface ReelCommentsModalProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function ReelCommentsModal({
  reelId,
  isOpen,
  onClose,
  onCommentAdded,
}: ReelCommentsModalProps) {
  const { user, profile, subscriptionTier, isSubscriptionActive } = useAuth();
  const [comments, setComments] = useState<ReelCommentItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && reelId) {
      setLoading(true);
      fetchReelComments(reelId)
        .then((data) => setComments(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, reelId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const username = profile?.name || user.displayName || user.email?.split('@')[0] || 'Cultivator';
      const updated = await postReelComment(reelId, {
        userId: user.uid,
        username,
        userEmail: user.email || '',
        text,
        userPlan: isSubscriptionActive ? subscriptionTier : 'free',
      });
      setComments(updated);
      setText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#0f0f18] border border-[#252538] sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#202032] flex items-center justify-between bg-[#131320]">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#202032] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No comments yet</p>
              <p className="text-xs text-gray-500">Be the first cultivation fan to leave a comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-900 to-amber-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-amber-500/30">
                  {comment.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-200 text-xs">{comment.username}</span>
                    {comment.userPlan && comment.userPlan !== 'free' && (
                      <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Crown className="w-2.5 h-2.5 mr-0.5" />
                        {comment.userPlan}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-xs sm:text-sm break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-[#202032] bg-[#12121c]">
          {user ? (
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-[#1a1a28] border border-[#2c2c40] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="p-2.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 disabled:opacity-40 text-white transition-all shadow-[0_0_10px_rgba(201,42,42,0.4)] flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs text-gray-400 py-1 px-2">
              <span>Sign in to join the Donghua community discussion</span>
              <Link
                href="/login"
                className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-colors"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
