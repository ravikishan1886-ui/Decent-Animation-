'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { ContinueWatchingSection } from '@/components/ContinueWatchingSection';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import {
  DONGHUA_GENRES,
  DONGHUA_ACCESS_TYPES,
  DONGHUA_LANGUAGES,
  SortOption,
  VideoItem,
} from '@/lib/types';
import {
  Compass,
  Filter,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Loader2,
  Film,
  Flame,
} from 'lucide-react';

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');

  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_SEED_VIDEOS);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(INITIAL_SEED_VIDEOS.length);

  // Live debounced search and filter query
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          genre: selectedGenre,
          accessType: selectedAccess,
          language: selectedLanguage,
          sort: selectedSort,
          limit: '40',
        });

        const res = await fetch(`/api/videos/search?${params.toString()}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        if (!isCancelled && data.videos) {
          setVideos(data.videos);
          setTotalCount(data.total);
        }
      } catch (err) {
        console.warn('Search fallback to client filter:', err);
        // Client fallback
        const queryLower = searchQuery.toLowerCase().trim();
        const filtered = INITIAL_SEED_VIDEOS.filter((v) => {
          if (queryLower) {
            const blob = `${v.title} ${v.donghuaName} ${v.description} ${(v.tags || []).join(' ')}`.toLowerCase();
            if (!blob.includes(queryLower)) return false;
          }
          if (selectedGenre !== 'All' && v.genre !== selectedGenre && v.category !== selectedGenre) {
            return false;
          }
          if (selectedAccess !== 'All') {
            const acc = selectedAccess.toLowerCase();
            if (acc === 'free' && v.accessType !== 'free') return false;
            if ((acc === 'vip' || acc === 'premium') && v.accessType !== 'vip') return false;
            if (acc === 'exclusive' && v.accessType !== 'exclusive') return false;
          }
          if (selectedLanguage !== 'All') {
            const lang = selectedLanguage.toLowerCase();
            if (!v.language.toLowerCase().includes(lang)) return false;
          }
          return true;
        });

        if (!isCancelled) {
          setVideos(filtered);
          setTotalCount(filtered.length);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedGenre, selectedAccess, selectedLanguage, selectedSort]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGenre !== 'All' ||
    selectedAccess !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedSort !== 'newest';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedAccess('All');
    setSelectedLanguage('All');
    setSelectedSort('newest');
  };

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Continue Watching Section for returning users */}
        <ContinueWatchingSection title="Jump Back In" limit={4} />

        {/* Page Title & Search Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-500 mb-1">
                <Compass className="w-4 h-4" />
                Grand Celestial Archive
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
                Explore <span className="text-[#c92a2a]">Donghua</span> Universe
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Search through cultivation arcs, martial tournaments, xianxia immortals, and Hindi dubs.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, characters, tags, arcs..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comprehensive Filter Controls Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101018] border border-[#232334] mb-8 space-y-4 shadow-xl">
          {/* Top Filter Bar: Access Type & Sort Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Access Types Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              {DONGHUA_ACCESS_TYPES.map((access) => (
                <button
                  key={access}
                  onClick={() => setSelectedAccess(access)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedAccess === access
                      ? 'bg-gradient-to-r from-[#c92a2a] to-amber-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {access === 'All' ? 'All Access' : access}
                </button>
              ))}
            </div>

            {/* Selects: Language & Sort By */}
            <div className="flex items-center gap-2.5">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  {DONGHUA_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang === 'All' ? 'All Audio / Dubs' : lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex items-center">
                <select
                  value={selectedSort}
                  onChange={(e: any) => setSelectedSort(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="newest">Newest Releases</option>
                  <option value="popular">Most Popular</option>
                  <option value="updated">Recently Updated</option>
                  <option value="title_asc">Title (A to Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Genre Chips Carousel */}
          <div className="pt-3 border-t border-zinc-850 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-amber-500" /> Genre:
            </span>
            {DONGHUA_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedGenre === genre
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Active Filter Chips & Clear Action */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-500 text-[11px]">Active Filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-300 text-[11px]">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedGenre !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-300 text-[11px]">
                    Genre: {selectedGenre}
                    <button onClick={() => setSelectedGenre('All')} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedAccess !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-300 text-[11px]">
                    Access: {selectedAccess}
                    <button onClick={() => setSelectedAccess('All')} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedLanguage !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-300 text-[11px]">
                    Audio: {selectedLanguage}
                    <button onClick={() => setSelectedLanguage('All')} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Counter & Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Showing <strong className="text-white">{videos.length}</strong> of <strong className="text-white">{totalCount}</strong> titles</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
          </div>
        </div>

        {/* Video Catalog Grid */}
        {loading && videos.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-zinc-400">Filtering celestial archives...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#101018] border border-[#232334] p-8 space-y-4">
            <Film className="h-12 w-12 text-zinc-600 mx-auto" />
            <div>
              <p className="text-base font-bold text-zinc-200">No Donghua matches your search criteria</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                We couldn&apos;t find any episodes matching &quot;{searchQuery}&quot; with current filters.
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {videos.map((video) => (
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
