'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ReelItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  toggleReelLike,
  toggleReelSave,
  recordReelView,
} from '@/lib/reel-service';
import { ReelCommentsModal } from './ReelCommentsModal';
import { DonghuaLogo } from './DonghuaLogo';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Crown,
  Lock,
  Tv,
  Check,
  Search,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface ReelCardProps {
  reel: ReelItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function ReelCard({
  reel,
  isActive,
  isMuted,
  onToggleMute,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, isAdmin, isSubscriptionActive } = useAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);
  const [videoError, setVideoError] = useState(false);

  // Likes & Saves state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [likeAnim, setLikeAnim] = useState(false);

  const [saved, setSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(reel.savesCount || 0);

  const [views, setViews] = useState(reel.views || 0);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(reel.commentsCount || 0);
  const [copiedToast, setCopiedToast] = useState(false);

  // All reels are 100% free and open to watch
  const hasAccess = true;

  // Initial state sync from backend
  useEffect(() => {
    if (user && reel.id) {
      fetch(`/api/reels/${reel.id}/like?userId=${user.uid}`)
        .then((r) => r.json())
        .then((d) => setLiked(Boolean(d.liked)))
        .catch(() => {});

      fetch(`/api/reels/${reel.id}/save?userId=${user.uid}`)
        .then((r) => r.json())
        .then((d) => setSaved(Boolean(d.saved)))
        .catch(() => {});
    }
  }, [user, reel.id]);

  // Video play/pause based on isActive prop & VIP access
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isActive && hasAccess && !videoError) {
      v.muted = isMuted;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay prevented/paused:', err);
            setIsPlaying(false);
          });
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, [isActive, hasAccess, isMuted, videoError]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // View counter threshold: record view after 2 seconds of being active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && hasAccess && !videoError) {
      timer = setTimeout(() => {
        recordReelView(reel.id).then((newViews) => {
          if (newViews) setViews(newViews);
        });
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isActive, hasAccess, videoError, reel.id]);

  // Handle video tap play/pause
  const handleVideoTap = () => {
    const v = videoRef.current;
    if (!v || !hasAccess) return;

    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayPauseIcon('play');
          setTimeout(() => setShowPlayPauseIcon(null), 800);
        })
        .catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      setShowPlayPauseIcon('pause');
      setTimeout(() => setShowPlayPauseIcon(null), 800);
    }
  };

  // Double tap to like
  const lastTapRef = useRef<number>(0);
  const handleTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger double-tap like
      triggerLike();
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 800);
    } else {
      handleVideoTap();
    }
    lastTapRef.current = now;
  };

  const triggerLike = async () => {
    if (!user) return;
    try {
      const res = await toggleReelLike(reel.id, user.uid);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleToggleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to like this reel!');
      return;
    }
    triggerLike();
  };

  const handleToggleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to save this reel!');
      return;
    }
    try {
      const res = await toggleReelSave(reel.id, user.uid);
      setSaved(res.saved);
      setSavesCount(res.savesCount);
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: reel.title,
      text: `${reel.title} — Watch high quality Donghua short reels on Decent Animation!`,
      url: `${window.location.origin}/reels?reelId=${reel.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to copy link
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden snap-start select-none">
      {/* Background Poster Blur on Desktop */}
      {reel.thumbnailUrl && (
        <div className="absolute inset-0 hidden md:block opacity-25 filter blur-3xl scale-125 transition-opacity">
          <Image
            src={reel.thumbnailUrl}
            alt="background blur"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* 9:16 Video Container */}
      <div className="relative w-full h-full max-w-[420px] aspect-[9/16] bg-neutral-950 flex items-center justify-center overflow-hidden shadow-2xl">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          playsInline
          loop
          preload={isActive ? 'auto' : 'metadata'}
          muted={isMuted}
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleTouchOrClick}
          onError={() => setVideoError(true)}
          onCanPlay={() => setVideoError(false)}
        />

        {/* Video Load Error Overlay */}
        {videoError && (
          <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
            <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
            <p className="text-sm font-bold text-white">Video Stream Unavailable</p>
            <p className="text-xs text-gray-400">
              Check your network connection or try reloading.
            </p>
            <button
              onClick={() => {
                setVideoError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Playback
            </button>
          </div>
        )}

        {/* Double-Tap Heart Animation Overlay */}
        {likeAnim && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40 animate-ping">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]" />
          </div>
        )}

        {/* Tap Play/Pause Feedback Indicator */}
        {showPlayPauseIcon && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-md animate-in zoom-in-50 duration-150">
              {showPlayPauseIcon === 'play' ? (
                <Play className="w-12 h-12 fill-white" />
              ) : (
                <Pause className="w-12 h-12 fill-white" />
              )}
            </div>
          </div>
        )}

        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between pointer-events-none">
          <Link
            href="/"
            className="flex items-center space-x-2 pointer-events-auto group"
          >
            <DonghuaLogo className="w-7 h-7" />
            <span className="font-black text-sm text-white tracking-wider">
              REELS
            </span>
          </Link>

          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Mute Toggle */}
            <button
              onClick={onToggleMute}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <Link
              href="/search"
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Toast copied popup */}
        {copiedToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-from-top-2">
            <Check className="w-4 h-4" />
            Reel link copied to clipboard!
          </div>
        )}

        {/* Right Action Column */}
        <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center space-y-4">
          {/* Like */}
          <button
            onClick={handleToggleLikeClick}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                liked
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                  : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
              }`}
            >
              <Heart
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  liked ? 'fill-white' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md mt-1 font-mono">
              {likesCount}
            </span>
          </button>

          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCommentsModalOpen(true);
            }}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10">
              <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md mt-1 font-mono">
              {commentsCount}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={handleShareClick}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10">
              <Share2 className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md mt-1">
              Share
            </span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={handleToggleSaveClick}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                saved
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
              }`}
            >
              <Bookmark
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  saved ? 'fill-black' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md mt-1 font-mono">
              {savesCount}
            </span>
          </button>
        </div>

        {/* Bottom Metadata & Info Overlay */}
        <div className="absolute bottom-0 left-0 right-16 p-4 pb-16 sm:pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 space-y-2 pointer-events-none">
          {/* Creator & VIP Badge */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-800 to-amber-600 flex items-center justify-center text-white text-[10px] font-black ring-1 ring-amber-400">
              DA
            </div>
            <span className="font-bold text-xs text-white truncate max-w-[140px]">
              {reel.creatorName || 'Decent Animation'}
            </span>

            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              FREE
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1 pointer-events-auto">
            <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
              {reel.title}
            </h2>
            {reel.description && (
              <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                {reel.description}
              </p>
            )}
          </div>

          {/* Hashtags */}
          {reel.hashtags && reel.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5 pointer-events-auto">
              {reel.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium text-amber-400 hover:underline cursor-pointer"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}{' '}
                </span>
              ))}
            </div>
          )}

          {/* Related Full Episode CTA button */}
          {(reel.episodeId || reel.seriesId) && (
            <div className="pt-2 pointer-events-auto">
              <Link
                href={`/watch/${reel.episodeId || reel.seriesId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.5)] group"
              >
                <Tv className="w-3.5 h-3.5 text-black" />
                <span>
                  Watch Full Episode
                  {reel.episodeNumber ? ` ${reel.episodeNumber}` : ''}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Comments Bottom Sheet Modal */}
      <ReelCommentsModal
        reelId={reel.id}
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        onCommentAdded={() => setCommentsCount((c) => c + 1)}
      />
    </div>
  );
}
