'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { VideoItem } from '@/lib/types';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { useAuth } from '@/lib/auth-context';
import { useWatchProgress } from '@/lib/use-watch-progress';
import {
  Lock,
  Crown,
  Download,
  Share2,
  Heart,
  Bookmark,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Sparkles,
  Tv,
  RotateCcw,
  Check,
} from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const videoId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  const { user, isAdmin, isSubscriptionActive, subscriptionTier } = useAuth();

  const video = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId) || INITIAL_SEED_VIDEOS[0];

  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [denyReason, setDenyReason] = useState<string>('');
  const [requiredTier, setRequiredTier] = useState<string>('basic');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<boolean>(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { saveStatus } = useWatchProgress({
    videoId: video?.id || videoId,
    videoRef,
    onInitialSeekReady: (savedSeconds) => {
      const minutes = Math.floor(savedSeconds / 60);
      const seconds = Math.floor(savedSeconds % 60);
      const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setResumeToast(`Resumed from ${formatted}`);
      setTimeout(() => setResumeToast(null), 4000);
    },
  });

  useEffect(() => {
    let active = true;

    async function verifyServerAccess() {
      if (!video?.id) {
        if (active) {
          setIsVerifying(false);
          setAccessGranted(false);
        }
        return;
      }

      // If video is free, allow instant playback without requiring network trip or auth
      if (video.accessType === 'free') {
        if (active) {
          setAccessGranted(true);
          setPlaybackUrl(video.videoStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
          setIsVerifying(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/video/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            userPlanTier: subscriptionTier || 'none',
            isSubscriptionActive: Boolean(isSubscriptionActive),
            isAdmin: Boolean(isAdmin),
            userId: user?.uid || null,
          }),
        });

        // Safely parse JSON or text to prevent "Unexpected token '<'"
        const contentType = res.headers.get('content-type') || '';
        let data: any = null;

        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          console.warn('Non-JSON response received from /api/video/access:', rawText.slice(0, 100));
          data = { allowed: false, reason: 'Server response unavailable' };
        }

        if (active) {
          if (res.ok && data?.allowed) {
            setAccessGranted(true);
            setPlaybackUrl(data.playbackUrl || video.videoStreamUrl || null);
          } else {
            setAccessGranted(false);
            setDenyReason(data?.reason || 'Active plan required');
            setRequiredTier(data?.requiredTier || 'basic');
          }
        }
      } catch (err) {
        console.error('Access check failed:', err);
        if (active) {
          setAccessGranted(false);
          setDenyReason('Verification server is momentarily unreachable.');
        }
      } finally {
        if (active) setIsVerifying(false);
      }
    }

    verifyServerAccess();

    return () => {
      active = false;
    };
  }, [video?.id, video?.accessType, video?.videoStreamUrl, subscriptionTier, isSubscriptionActive, isAdmin, user]);

  const handleDownload = async () => {
    if (!video || !user) {
      router.push('/login');
      return;
    }

    setDownloadLoading(true);
    setDownloadSuccess(null);

    try {
      const res = await fetch('/api/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          userPlanTier: subscriptionTier || 'none',
          isSubscriptionActive: Boolean(isSubscriptionActive),
          isAdmin: Boolean(isAdmin),
          userId: user.uid,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Unexpected non-JSON response from download server.');
      }

      if (!res.ok || !data?.allowed) {
        throw new Error(data?.error || 'Failed to authorize download');
      }

      setDownloadSuccess(`Controlled download authorized: ${data.fileName}. Temporary signed link generated.`);
      const anchor = document.createElement('a');
      anchor.href = data.downloadUrl;
      anchor.download = data.fileName;
      anchor.target = '_blank';
      anchor.click();
    } catch (err: any) {
      alert(err.message || 'Download error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const relatedEpisodes = INITIAL_SEED_VIDEOS.filter((v) => v.id !== video?.id);

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Main Video Stage */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232334] shadow-2xl">
          {isVerifying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d14] text-gray-400 space-y-3">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono tracking-wider">Verifying Cultivator Dao Privileges...</p>
            </div>
          ) : accessGranted && playbackUrl ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={playbackUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                poster={video.thumbnailUrl}
              >
                Your browser does not support HTML5 video player.
              </video>

              {/* Dynamic Resume Toast Overlay */}
              {resumeToast && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl animate-fade-in">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>{resumeToast}</span>
                </div>
              )}

              {/* Subtle Sync Indicator */}
              {saveStatus === 'saved' && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  <Check className="w-3 h-3" /> Progress Synced
                </div>
              )}
            </div>
          ) : (
            /* Locked Paywall Experience */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover filter blur-md brightness-[0.25]"
              />

              <div className="relative z-10 max-w-md space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-600/50 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(201,42,42,0.8)]">
                  {video.accessType === 'vip' ? (
                    <Crown className="w-8 h-8 text-amber-400" />
                  ) : (
                    <Lock className="w-8 h-8 text-red-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-400">
                    {video.accessType === 'vip' ? 'VIP Cultivator Episode' : 'Subscription Required'}
                  </span>
                  <h2 className="text-2xl font-black text-white font-serif">
                    THIS EPISODE IS PROTECTED
                  </h2>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {denyReason || 'Subscribe to unlock this high-bitrate master episode in Hindi Dub & English Sub.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => router.push(`/subscription?plan=${requiredTier}`)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#c92a2a] to-amber-600 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,42,42,0.5)] flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Unlock with {requiredTier.toUpperCase()} Plan
                  </button>
                  {!user && (
                    <button
                      onClick={() => router.push(`/login?redirect=/watch/${video.id}`)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-semibold text-gray-300 bg-[#161622] hover:bg-[#1f1f2e] border border-[#2b2b3d]"
                    >
                      Already a member? Log In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info & Controls Bar */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#1c1c2a]">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded bg-red-950/60 border border-red-800/50 text-red-300 font-bold uppercase">
                {video.donghuaName}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#181824] text-amber-400 font-mono">
                Season {video.seasonNumber} • Episode {video.episodeNumber}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#181824] text-gray-400">
                {video.language}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-[11px] uppercase">
                {video.accessType.toUpperCase()} TIER
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {video.title}
            </h1>

            {/* Plan-Delivered Stream Features Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Quality</p>
                  <p className="text-xs font-bold text-white font-mono truncate">
                    {subscriptionTier === 'vip' ? '4K UltraHD 60fps' : subscriptionTier === 'premium' ? '1080p FHD' : '720p HD'}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Ad Experience</p>
                  <p className="text-xs font-bold text-white truncate">
                    {subscriptionTier === 'vip' || subscriptionTier === 'premium' || video.adsAllowed === false
                      ? '100% Ad-Free'
                      : 'Standard Ads'}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Offline Access</p>
                  <p className="text-xs font-bold text-white truncate">
                    {video.downloadAllowed ? (subscriptionTier === 'vip' || subscriptionTier === 'premium' ? 'Unlocked' : 'Requires VIP/Prem') : 'Disabled'}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Audio Track</p>
                  <p className="text-xs font-bold text-white truncate">
                    {video.audio || 'Hindi Dubbed'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl pt-1">
              {video.description}
            </p>

            {video.rightsStatus && (
              <div className="flex items-center gap-2 pt-1 text-xs text-gray-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Licensing: {video.rightsStatus} ({video.licenseInfo})</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLiked
                  ? 'bg-red-950/70 border-red-600 text-red-300'
                  : 'bg-[#15151f] border-[#29293d] text-gray-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{video.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isSaved
                  ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                  : 'bg-[#15151f] border-[#29293d] text-gray-300 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Watchlist'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#15151f] border border-[#29293d] text-gray-300 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{copyToast ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#212130] to-[#2c2c42] hover:border-amber-500/60 border border-[#393952] text-amber-300 transition-all shadow-md"
            >
              {downloadLoading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download Episode</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* More Episodes & Recommended */}
        <div className="mt-10 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              More Episodes &amp; Recommended Sagas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedEpisodes.map((rel) => (
              <VideoCard key={rel.id} video={rel} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
