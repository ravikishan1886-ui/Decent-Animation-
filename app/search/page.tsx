'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { Search as SearchIcon, X, Tag, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    INITIAL_SEED_VIDEOS.forEach((v) => {
      v.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, []);

  const results = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return INITIAL_SEED_VIDEOS.filter((video) => {
      if (selectedTag && !video.tags.includes(selectedTag)) {
        return false;
      }
      if (!term) return true;

      const inTitle = video.title.toLowerCase().includes(term);
      const inDonghuaName = video.donghuaName.toLowerCase().includes(term);
      const inDescription = video.description.toLowerCase().includes(term);
      const inGenre = video.genre.toLowerCase().includes(term);
      const inTags = video.tags.some((t) => t.toLowerCase().includes(term));
      const inEpisode = `ep ${video.episodeNumber}`.includes(term) || `episode ${video.episodeNumber}`.includes(term);

      return inTitle || inDonghuaName || inDescription || inGenre || inTags || inEpisode;
    });
  }, [searchTerm, selectedTag]);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search Input Box */}
        <div className="max-w-2xl mx-auto space-y-4 mb-10">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Donghua name, episode, genre, character, or tags..."
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

          {/* Quick Tag Recommendations */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              Popular Tags:
            </span>
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedTag === tag
                    ? 'bg-red-700 text-white font-bold shadow'
                    : 'bg-[#181824] text-gray-300 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-amber-400 underline font-semibold ml-1"
              >
                Clear Tag
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[#1c1c2a] pb-3">
          <p className="text-sm font-semibold text-gray-300">
            {searchTerm || selectedTag ? `Found ${results.length} results` : 'Trending & Popular Sagas'}
          </p>
          <span className="text-xs text-amber-500 font-mono">Hindi &amp; English Catalog</span>
        </div>

        {/* Results Grid */}
        {results.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-gray-200">No divine manuscripts found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              We couldn&apos;t find any Donghua matching &quot;{searchTerm}&quot;. Try searching for popular titles like &quot;Soul Land&quot;, &quot;Xiao Yan&quot;, or &quot;Cultivation&quot;.
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
