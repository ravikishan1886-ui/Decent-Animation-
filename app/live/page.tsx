'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LiveStreamItem } from '@/lib/types';
import { Radio, Users, Heart, Calendar, Play, Sparkles } from 'lucide-react';

export default function LiveListPage() {
  const [streams, setStreams] = useState<LiveStreamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/live');
      if (res.ok) {
        const data = await res.json();
        setStreams(data.streams || []);
      }
    } catch (e) {
      console.warn('Live streams fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const activeStreams = streams.filter((s) => s.status === 'live');
  const upcomingStreams = streams.filter((s) => s.status === 'scheduled');
  const pastStreams = streams.filter((s) => s.status === 'ended');

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(201,42,42,0.3)]">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Decent Animation Broadcast Arena</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Live Donghua Premieres &amp; Watch Parties
          </h1>

          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Join fellow cultivators in real-time Hindi Dub watch-alongs, episode premieres, and community discussions with live Super Chat.
          </p>
        </div>

        {/* Live Right Now Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[#202030] pb-3">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Live Right Now</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500 font-mono">
              Connecting to live broadcast servers...
            </div>
          ) : activeStreams.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#12121a] border border-[#242436] text-center space-y-2">
              <Radio className="w-8 h-8 mx-auto text-gray-600" />
              <p className="text-sm font-bold text-gray-300">No Live Broadcasts Active Right Now</p>
              <p className="text-xs text-gray-500">
                Check the schedule below for upcoming Hindi Dub premieres and watch parties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStreams.map((s) => (
                <Link
                  key={s.id}
                  href={`/live/${s.id}`}
                  className="group rounded-3xl bg-[#12121a] border border-red-600/40 overflow-hidden hover:border-red-500 transition-all shadow-[0_0_25px_rgba(201,42,42,0.15)] flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      LIVE
                    </div>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-gray-300 text-[10px] font-mono flex items-center gap-1">
                      <Users className="w-3 h-3 text-red-400" />
                      {s.viewerCount || 0} watching
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {s.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1e1e2e] text-xs">
                      <span className="font-mono text-emerald-400 font-bold">
                        ₹{s.superChatTotal || 0} Super Chat
                      </span>
                      <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                        Join Broadcast →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled / Upcoming Section */}
        {upcomingStreams.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-[#202030] pb-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-white">Upcoming Premieres &amp; Events</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingStreams.map((s) => (
                <div
                  key={s.id}
                  className="rounded-3xl bg-[#12121a] border border-[#242436] overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-black">
                    <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      SCHEDULED
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{s.description}</p>
                    {s.scheduledStartTime && (
                      <p className="text-[11px] text-amber-400 font-mono">
                        Starts: {new Date(s.scheduledStartTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
