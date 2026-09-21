'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Clock, Sparkles, X, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { WatchHistoryItem } from '@/lib/types';

interface Props {
  title?: string;
  limit?: number;
  showEmptyState?: boolean;
}

export function ContinueWatchingSection({
  title = 'Continue Watching',
  limit = 6,
  showEmptyState = false,
}: Props) {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return;

    fetch(`/api/watch-history?userId=${user.uid}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.history) {
          setHistoryItems(data.history);
        }
      })
      .catch((e) => console.warn('Error loading watch history:', e))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, limit]);

  const handleRemove = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setHistoryItems((prev) => prev.filter((item) => item.videoId !== videoId));
    try {
      await fetch(`/api/watch-history?userId=${user.uid}&videoId=${videoId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Could not remove history item:', err);
    }
  };

  if (!user || (!loading && historyItems.length === 0 && !showEmptyState)) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/10 border border-red-600/20 text-red-500">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-serif">{title}</h2>
        </div>
        <Link
          href="/dashboard#history"
          className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          View Full History <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 bg-zinc-950/40 rounded-2xl border border-zinc-900">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500 mr-2" />
          <span className="text-xs text-zinc-400">Loading your playback history...</span>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 text-center text-xs text-zinc-500">
          You have no episodes in progress yet. Pick an episode from below to begin your cultivation journey!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {historyItems.map((item) => {
            const video = item.video;
            const progress = item.progressPercent || 0;
            const minutesLeft = Math.max(1, Math.round((item.duration - item.progress) / 60));

            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-[#101018] border border-[#222233] hover:border-amber-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/50"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  <Image
                    src={video?.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'}
                    alt={video?.title || 'Donghua Episode'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Play Overlay Button */}
                  <Link
                    href={`/watch/${item.videoId}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/90 text-zinc-950 shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </Link>

                  {/* Top Bar Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-amber-500/30">
                      Ep {video?.episodeNumber || 1}
                    </span>
                    <button
                      onClick={(e) => handleRemove(e, item.videoId)}
                      className="pointer-events-auto p-1 rounded-md bg-black/75 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                      title="Remove from Continue Watching"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Red/Gold Progress Bar at the bottom of thumbnail */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500"
                      style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
                    />
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-medium text-amber-400/80 truncate">
                      {video?.donghuaName || 'Decent Animation'}
                    </div>
                    <Link
                      href={`/watch/${item.videoId}`}
                      className="text-xs font-bold text-white hover:text-amber-400 line-clamp-1 transition-colors"
                    >
                      {video?.title || 'Episode'}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      {item.completed ? 'Finished' : `${minutesLeft} min left`}
                    </span>
                    <span className="font-mono text-zinc-500">{progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
