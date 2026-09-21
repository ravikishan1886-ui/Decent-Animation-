'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VideoItem } from '@/lib/types';
import { Play, Sparkles, Crown } from 'lucide-react';

interface HeroBannerProps {
  featuredVideo: VideoItem;
}

const STATIC_PARTICLES = [
  { id: 1, left: 12, top: 25, size: 3, duration: 4 },
  { id: 2, left: 28, top: 65, size: 4, duration: 5 },
  { id: 3, left: 45, top: 18, size: 2, duration: 6 },
  { id: 4, left: 62, top: 75, size: 3.5, duration: 4.5 },
  { id: 5, left: 80, top: 32, size: 4, duration: 5.5 },
  { id: 6, left: 91, top: 58, size: 2.5, duration: 3.8 },
  { id: 7, left: 35, top: 82, size: 3, duration: 6.2 },
  { id: 8, left: 74, top: 15, size: 4, duration: 4.8 },
];

export function HeroBanner({ featuredVideo }: HeroBannerProps) {
  return (
    <div className="relative w-full min-h-[480px] md:min-h-[580px] lg:min-h-[640px] flex items-end pb-12 overflow-hidden bg-[#09090e]">
      {/* Background Artwork */}
      <div className="absolute inset-0">
        <img
          src={featuredVideo.thumbnailUrl}
          alt={featuredVideo.title}
          className="w-full h-full object-cover object-center filter brightness-[0.72] scale-105"
        />
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-[#08080b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080b] via-[#08080b]/70 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-[#08080b]/90 pointer-events-none" />
      </div>

      {/* Floating Gold/Red Cultivation Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STATIC_PARTICLES.map((pt) => (
          <div
            key={pt.id}
            className="absolute rounded-full bg-amber-400/60 shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse"
            style={{
              left: `${pt.left}%`,
              top: `${pt.top}%`,
              width: `${pt.size}px`,
              height: `${pt.size}px`,
              animationDuration: `${pt.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-[0_0_15px_rgba(201,42,42,0.6)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Masterpiece
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-black/60 border border-amber-500/40 text-amber-300">
              {featuredVideo.genre}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-black/50 text-gray-300">
              {featuredVideo.language}
            </span>
          </div>

          {/* Donghua Series Title */}
          <p className="text-amber-400 font-mono text-sm tracking-widest uppercase flex items-center gap-1.5">
            <span>修仙神作</span> • {featuredVideo.donghuaName}
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-serif">
            ENTER THE WORLD OF DONGHUA
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
            Watch legendary Chinese animation, cultivation stories, ancient immortals, and mythical fantasy adventures in supreme Hindi dubbed and English subtitled quality.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${featuredVideo.id}`}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#c92a2a] via-[#e03131] to-[#d4af37] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,42,42,0.5)] transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-white" />
              Watch Now
            </Link>

            <Link
              href="/browse"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-gray-200 bg-[#161622]/90 hover:bg-[#1e1e30] border border-[#2e2e42] hover:border-amber-500/40 transition-all backdrop-blur-sm"
            >
              Browse Donghua
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
