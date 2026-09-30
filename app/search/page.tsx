'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { VideoItem, DONGHUA_GENRES } from '@/lib/types';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { subscribeToFirebaseVideos } from '@/lib/video-service';
import { Search as SearchIcon, X, Tag, Sparkles, Filter, ArrowUpDown } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alpha'>('newest');
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_SEED_VIDEOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Realtime Database for live video search
    const unsubscribe = subscribeToFirebaseVideos((dynamicVideos) => {
      if (dynamicVideos && dynamicVideos.length > 0) {
        setVideos(dynamicVideos);
      }
      setLoading(false);
    }, true);

    return () => {
      unsubscribe();
    };
  }, []);

  const results = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let filtered = videos.filter((video) => {
      // Access Filter
      if (selectedAccess !== 'All') {
        if (selectedAccess === 'Free' && video.accessType !== 'free') return false;
        if (selectedAccess === 'Basic+' && !(video.accessType === 'free' || video.accessType === 'subscription')) return false;
        if (selectedAccess === 'Premium+' && !(video.accessType === 'free' || video.accessType === 'subscription' || video.accessType === 'exclusive')) return false;
        if (selectedAccess === 'VIP' && video.accessType !== 'vip') return false;
      }

      // Genre Filter
      if (selectedGenre !== 'All') {
        const matchGenre =
          video.genre.toLowerCase() === selectedGenre.toLowerCase() ||
          video.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
        if (!matchGenre) return false;
      }

      // Term Filter
      if (!term) return true;

      const inTitle = video.title.toLowerCase().includes(term);
      const inSeries = (video.seriesName || video.donghuaName || '').toLowerCase().includes(term);
      const inDescription = video.description.toLowerCase().includes(term);
      const inGenre = video.genre.toLowerCase().includes(term);
      const inTags = video.tags?.some((t) => t.toLowerCase().includes(term));
      const inEpisode = `ep ${video.episodeNumber}`.includes(term) || `episode ${video.episodeNumber}`.includes(term);

      return inTitle || inSeries || inDescription || inGenre || inTags || inEpisode;
    });

    // Sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [searchTerm, selectedGenre, selectedAccess, sortBy, videos]);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto space-y-4 mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Title, Series name, Description, Genre, Tags, Episode..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#11111a] border border-[#2b2b3d] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm shadow-xl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Sorting Control Bar */}
          <div className="p-4 rounded-2xl bg-[#0f0f18] border border-[#202032] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Genre & Access Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-gray-400 font-semibold shrink-0">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Filters:</span>
              </div>

              {/* Genre Select */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#161624] border border-[#2a2a3e] text-white text-xs"
              >
                <option value="All">All Genres</option>
                {DONGHUA_GENRES.filter((g) => g !== 'All').map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Access Select */}
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#161624] border border-[#2a2a3e] text-amber-300 font-bold text-xs"
              >
                <option value="All">All Access</option>
                <option value="Free">Free</option>
                <option value="Basic+">Basic+</option>
                <option value="Premium+">Premium+</option>
                <option value="VIP">VIP Only</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-gray-400 font-semibold shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[#161624] border border-[#2a2a3e] text-white text-xs font-semibold"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="alpha">A-Z Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[#1c1c2a] pb-3">
          <p className="text-sm font-semibold text-gray-300">
            Found <span className="text-amber-400 font-mono font-bold">{results.length}</span> matching episodes
          </p>
          <span className="text-xs text-amber-500 font-mono">AVCaption Streaming Catalogue</span>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400 font-mono">
            Searching AVCaption video database...
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-gray-200">No episodes found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              We couldn&apos;t find any content matching your query or filter criteria. Try resetting filters or search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
