import React from 'react';
import Link from 'next/link';
import { VideoItem } from '@/lib/types';
import { VideoCard } from './VideoCard';
import { ChevronRight } from 'lucide-react';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  videos: VideoItem[];
  viewAllHref?: string;
}

export function ContentRow({ title, subtitle, badge, videos, viewAllHref }: ContentRowProps) {
  if (!videos || videos.length === 0) return null;

  return (
    <section className="space-y-3.5 my-8">
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#c92a2a] to-amber-500 inline-block" />
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Responsive Horizontal Scroll / Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((vid) => (
          <VideoCard key={vid.id} video={vid} />
        ))}
      </div>
    </section>
  );
}
