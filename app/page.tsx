'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { ContinueWatchingSection } from '@/components/ContinueWatchingSection';
import { PersonalizedBanner } from '@/components/PersonalizedBanner';
import { PollWidget } from '@/components/PollWidget';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoItem, AnnouncementItem } from '@/lib/types';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { subscribeToFirebaseVideos } from '@/lib/video-service';
import { Sparkles, Flame, ShieldAlert, Award, Megaphone, Radio, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_SEED_VIDEOS);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to Firebase Realtime Database for live updates when admin publishes videos
    const unsubscribe = subscribeToFirebaseVideos((dynamicVideos) => {
      if (dynamicVideos && dynamicVideos.length > 0) {
        setVideos(dynamicVideos);
      }
      setLoading(false);
    }, true);

    // 2. Fetch announcements
    fetch('/api/announcements')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.announcements) {
          setAnnouncements(data.announcements);
        }
      })
      .catch((e) => console.warn('Announcement fetch notice:', e));

    return () => {
      unsubscribe();
    };
  }, []);

  const featured = videos[0] || INITIAL_SEED_VIDEOS[0];
  const popular = videos.filter((v) => v.views > 100000);
  const latestEpisodes = [...videos].sort((a, b) => b.episodeNumber - a.episodeNumber);

  const activeAnnouncement = announcements.find((a) => a.active);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      {/* Broadcast Announcement Bar if active */}
      {activeAnnouncement && (
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b border-amber-500/30 px-4 py-2 text-center text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-200">
            <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-bold text-white">{activeAnnouncement.title}:</span>
            <span className="truncate">{activeAnnouncement.content}</span>
            {activeAnnouncement.link && (
              <a
                href={activeAnnouncement.link}
                className="underline font-bold text-amber-300 hover:text-white ml-1 shrink-0"
              >
                Learn More →
              </a>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 pb-16 space-y-8">
        {/* Dynamic Personalized Cultivator Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <PersonalizedBanner />
        </div>

        {/* Cinematic Hero Section */}
        <HeroBanner featuredVideo={featured} />

        {/* Content Showcase Rows */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-12">
          {/* Quick Culture Pill Navigation & Quick Links */}
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

            <div className="flex items-center gap-2">
              <Link
                href="/live"
                className="px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-700/60 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
                <span>Live Streams</span>
              </Link>
              <Link
                href="/leaderboard"
                className="px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Leaderboard</span>
              </Link>
            </div>
          </div>

          {/* User Watch History Continue Watching Carousel */}
          <ContinueWatchingSection title="Continue Watching" limit={4} />

          {/* Community Poll Interactive Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1">
              <PollWidget />
            </div>

            <div className="lg:col-span-2">
              {/* Trending Donghua Row */}
              <ContentRow
                title="Trending Donghua"
                subtitle="The hottest cultivating battles and heavenly tribulation arcs in India"
                badge="Top Rated"
                videos={popular}
                viewAllHref="/browse?filter=trending"
              />
            </div>
          </div>

          {/* Latest Episodes Row */}
          <ContentRow
            title="Latest Episodes"
            subtitle="Fresh weekly releases with Hindi audio dub and synchronized English subtitles"
            badge="New"
            videos={latestEpisodes}
            viewAllHref="/browse?filter=latest"
          />

          {/* Cultivation Masterpieces Row */}
          <ContentRow
            title="Cultivation &amp; Xianxia Epics"
            subtitle="Top-rated heavenly tribulation battles, martial souls, and immortal realms"
            badge="Featured"
            videos={videos}
            viewAllHref="/browse?genre=Cultivation"
          />
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
