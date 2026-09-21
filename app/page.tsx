'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { ContinueWatchingSection } from '@/components/ContinueWatchingSection';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoItem } from '@/lib/types';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_SEED_VIDEOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        const q = query(collection(db, 'videos'), where('published', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: VideoItem[] = [];
          snap.forEach((doc) => {
            list.push({ id: doc.id, ...(doc.data() as any) });
          });
          // Merge with initial seed videos
          const merged = [...list, ...INITIAL_SEED_VIDEOS.filter((s) => !list.some((l) => l.id === s.id))];
          setVideos(merged);
        }
      } catch (err) {
        // Fallback gracefully to seed videos
        console.warn('Using seed video catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, []);

  const featured = videos[0] || INITIAL_SEED_VIDEOS[0];
  const popular = videos.filter((v) => v.views > 100000);
  const latestEpisodes = [...videos].sort((a, b) => b.episodeNumber - a.episodeNumber);
  const freeToWatch = videos.filter((v) => v.accessType === 'free');
  const premiumEpisodes = videos.filter((v) => v.accessType === 'subscription' || v.accessType === 'exclusive');
  const exclusiveVip = videos.filter((v) => v.accessType === 'vip');

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Cinematic Hero Section */}
        <HeroBanner featuredVideo={featured} />

        {/* Content Showcase Rows */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-12">
          {/* Quick Culture Pill Navigation */}
          <div className="p-4 rounded-2xl bg-[#0f0f17]/90 border border-[#232334] backdrop-blur-md flex items-center justify-between overflow-x-auto gap-4 no-scrollbar">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Popular Realms:
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {['Cultivation', 'Xianxia', 'Martial Arts', 'Hindi Dubbed', 'Reincarnation'].map((cat) => (
                <a
                  key={cat}
                  href={`/browse?genre=${cat}`}
                  className="px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-red-950/50 hover:text-amber-300 text-gray-300 border border-[#2b2b3b] transition-all whitespace-nowrap"
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>

          {/* User Watch History Continue Watching Carousel */}
          <ContinueWatchingSection title="Continue Watching" limit={4} />

          {/* Trending Donghua Row */}
          <ContentRow
            title="Trending Donghua"
            subtitle="The hottest cultivating battles and heavenly tribulation arcs in India"
            badge="Top Rated"
            videos={popular}
            viewAllHref="/browse?filter=trending"
          />

          {/* Latest Episodes Row */}
          <ContentRow
            title="Latest Episodes"
            subtitle="Fresh weekly releases with Hindi audio dub and synchronized English subtitles"
            badge="New"
            videos={latestEpisodes}
            viewAllHref="/browse?filter=latest"
          />

          {/* Free to Watch Row */}
          <ContentRow
            title="Free to Watch"
            subtitle="No subscription required. Start your cultivation journey instantly"
            badge="100% Free"
            videos={freeToWatch}
            viewAllHref="/browse?filter=free"
          />

          {/* Premium & Exclusive Content Row */}
          <ContentRow
            title="Premium & Exclusive Sagas"
            subtitle="High-bitrate 1080p / 4K master streams for verified subscribers"
            badge="Premium"
            videos={premiumEpisodes}
            viewAllHref="/browse?filter=premium"
          />

          {/* VIP Only Realm */}
          {exclusiveVip.length > 0 && (
            <ContentRow
              title="VIP Cultivator Realm"
              subtitle="Early access first-window premieres for VIP Yearly members"
              badge="VIP Only"
              videos={exclusiveVip}
              viewAllHref="/browse?filter=vip"
            />
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
