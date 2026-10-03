'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ReelCard } from '@/components/ReelCard';
import { ReelItem } from '@/lib/types';
import { fetchReels } from '@/lib/reel-service';
import {
  Film,
  RotateCcw,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadReels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReels('published');
      setReels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Handle Keyboard Arrow Up / Arrow Down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length]);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= reels.length) return;
    const container = containerRef.current;
    if (!container) return;

    const targetEl = container.children[index] as HTMLElement;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  // IntersectionObserver to accurately track visible active reel
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.6],
      }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [reels]);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 relative w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-black overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-sm font-semibold text-gray-300">
              Loading High-Definition Donghua Reels...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
            <p className="text-sm font-bold text-white">Network Connection Error</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button
              onClick={loadReels}
              className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(201,42,42,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 text-center p-6 max-w-sm">
            <Film className="w-12 h-12 text-amber-400" />
            <p className="text-base font-bold text-white">No Reels Published Yet</p>
            <p className="text-xs text-gray-400">
              Check back soon for exciting Donghua short clips, fight scenes, and trailers!
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Navigation Arrows */}
            <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col space-y-3">
              <button
                onClick={() => scrollToIndex(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="p-3 rounded-full bg-[#181824]/80 hover:bg-[#252538] border border-[#2e2e42] disabled:opacity-30 text-white transition-all shadow-xl"
                aria-label="Previous reel"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToIndex(activeIndex + 1)}
                disabled={activeIndex === reels.length - 1}
                className="p-3 rounded-full bg-[#181824]/80 hover:bg-[#252538] border border-[#2e2e42] disabled:opacity-30 text-white transition-all shadow-xl"
                aria-label="Next reel"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Vertical Scroll Snapping Reel Container */}
            <div
              ref={containerRef}
              className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
              style={{ scrollSnapType: 'y mandatory' }}
            >
              {reels.map((reel, idx) => (
                <div
                  key={reel.id}
                  data-index={idx}
                  className="w-full h-full snap-start flex items-center justify-center"
                >
                  <ReelCard
                    reel={reel}
                    isActive={idx === activeIndex}
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted((m) => !m)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
