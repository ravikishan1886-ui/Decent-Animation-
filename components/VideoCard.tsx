'use client';

import React from 'react';
import Link from 'next/link';
import { VideoItem } from '@/lib/types';
import { Play, Lock, Crown, Sparkles, Clock, Eye } from 'lucide-react';

interface VideoCardProps {
  video: VideoItem;
  userHasAccess?: boolean;
}

export function VideoCard({ video, userHasAccess = true }: VideoCardProps) {
  const isFree = video.accessType === 'free';
  const isVIP = video.accessType === 'vip';
  const isExclusive = video.accessType === 'exclusive';
  const isSubscription = video.accessType === 'subscription';

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group relative flex flex-col rounded-xl bg-[#111118] border border-[#21212e] hover:border-amber-500/50 transition-all duration-300 overflow-hidden hover:shadow-[0_8px_30px_rgba(201,42,42,0.25)] hover:-translate-y-1"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#181824]">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30" />

        {/* Badges on Top */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {isFree && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/90 text-white shadow-md">
              Free
            </span>
          )}
          {isSubscription && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-600/90 text-white shadow-md">
              Subscription
            </span>
          )}
          {isExclusive && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-purple-600 to-red-600 text-white shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Exclusive
            </span>
          )}
          {isVIP && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold shadow-md flex items-center gap-1">
              <Crown className="w-2.5 h-2.5 fill-black" />
              VIP
            </span>
          )}
        </div>

        {/* Duration Chip */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-gray-200 backdrop-blur-sm">
          <Clock className="w-2.5 h-2.5 text-gray-400" />
          {video.duration}
        </div>

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#c92a2a] to-amber-600 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            {!userHasAccess && !isFree ? (
              <Lock className="w-5 h-5 text-amber-200" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Content Meta */}
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-[11px] text-amber-500/90 font-mono mb-1">
          <span className="truncate max-w-[70%] font-semibold">{video.donghuaName}</span>
          <span>EP {video.episodeNumber}</span>
        </div>

        <h3 className="text-sm font-bold text-gray-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
          {video.title}
        </h3>

        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed flex-1">
          {video.description}
        </p>

        {/* Footer Meta */}
        <div className="mt-3 pt-2.5 border-t border-[#1e1e2c] flex items-center justify-between text-[11px] text-gray-400">
          <span className="px-1.5 py-0.5 rounded bg-[#181822] text-gray-400 font-medium">
            {video.language}
          </span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-gray-400" />
            <span>{(video.views / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
