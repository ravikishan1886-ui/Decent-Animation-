'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { VideoCard } from '@/components/VideoCard';
import { VideoComments } from '@/components/VideoComments';
import { VideoItem } from '@/lib/types';
import { INITIAL_SEED_VIDEOS } from '@/lib/seed-data';
import { useAuth } from '@/lib/auth-context';
import { useWatchProgress } from '@/lib/use-watch-progress';
import {
  Lock,
  Crown,
  Download,
  Share2,
  Bookmark,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Sparkles,
  Tv,
  RotateCcw,
  Check,
  Play,
  ArrowRight,
  ListVideo,
} from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const videoId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  const { user, isAdmin } = useAuth();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [seriesEpisodes, setSeriesEpisodes] = useState<VideoItem[]>([]);
  const [loadingVideo, setLoadingVideo] = useState<boolean>(true);

  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<boolean>(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load video metadata from API (Firebase Realtime Database)
  useEffect(() => {
    let active = true;

    async function loadVideoDetails() {
      setLoadingVideo(true);
      try {
        // Fetch specific video
        const res = await fetch(`/api/videos?id=${encodeURIComponent(videoId)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.video) {
            setVideo(data.video);
          }
        } else {
          // Fallback to initial seed if API is initializing
          const fallback = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId) || INITIAL_SEED_VIDEOS[0];
          if (active) setVideo(fallback);
        }

        // Fetch all published videos for series grouping
        const allRes = await fetch('/api/videos');
        if (allRes.ok) {
          const allData = await allRes.json();
          if (active && allData.success && allData.videos) {
            setAllVideos(allData.videos);
          }
        }
      } catch (err) {
        console.warn('Video load fallback to seed catalog:', err);
        const fallback = INITIAL_SEED_VIDEOS.find((v) => v.id === videoId) || INITIAL_SEED_VIDEOS[0];
        if (active) {
          setVideo(fallback);
          setAllVideos(INITIAL_SEED_VIDEOS);
        }
      } finally {
        if (active) setLoadingVideo(false);
      }
    }

    if (videoId) {
      loadVideoDetails();
    }
  }, [videoId]);

  // Compute related episodes in the same series, strictly sorted NUMERICALLY
  useEffect(() => {
    if (!video) return;

    const currentSeries = (video.seriesName || video.donghuaName || '').toLowerCase().trim();
    if (!currentSeries) {
      setSeriesEpisodes([]);
      return;
    }

    const matched = allVideos.filter((v) => {
      const s = (v.seriesName || v.donghuaName || '').toLowerCase().trim();
      return s === currentSeries || v.seriesId === video.seriesId;
    });

    // Numerical sort: Episode 1, 2, ... 9, 10, 11
    matched.sort((a, b) => {
      const epA = Number(a.episodeNumber) || 0;
      const epB = Number(b.episodeNumber) || 0;
      if (epA !== epB) return epA - epB;
      return (Number(a.seasonNumber) || 1) - (Number(b.seasonNumber) || 1);
    });

    setSeriesEpisodes(matched);
  }, [video, allVideos]);

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

  // Verify access privileges - all content is 100% free
  useEffect(() => {
    if (!video) return;

    setAccessGranted(true);
    setIsVerifying(false);
    const effectiveUrl =
      video.videoUrl ||
      video.videoStreamUrl ||
      video.embedUrl ||
      video.avcaptionUrl ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    setPlaybackUrl(effectiveUrl);
  }, [video]);

  const handleDownload = async () => {
    if (!video) return;
    if (!user) {
      router.push(`/login?redirect=/watch/${video.id}`);
      return;
    }

    setDownloadLoading(true);
    try {
      const res = await fetch('/api/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
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
        throw new Error(data?.error || 'Failed to authorize download. Requires active subscription.');
      }

      setDownloadSuccess(`Authorized download: ${data.fileName}. Temporary link generated.`);
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

  // Recommendations
  const otherVideos = allVideos.filter((v) => v.id !== video?.id && !seriesEpisodes.some((se) => se.id === v.id)).slice(0, 4);

  if (loadingVideo || !video) {
    return (
      <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-gray-400">Loading AVCaption Video Experience...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isFirebaseStorage = Boolean(
    video?.videoSource === 'firebase' ||
    video?.videoStoragePath ||
    (playbackUrl && (
      playbackUrl.includes('firebasestorage.googleapis.com') ||
      playbackUrl.startsWith('/api/media/') ||
      playbackUrl.startsWith('/uploads/') ||
      playbackUrl.match(/\.(mp4|webm|m3u8|mov|mkv)($|\?)/i)
    ))
  );

  const isEmbedPlayer = !isFirebaseStorage && Boolean(
    playbackUrl && (
      playbackUrl.includes('embed') ||
      playbackUrl.includes('avcaption') ||
      playbackUrl.includes('iframe') ||
      video?.videoSource === 'external'
    ) && !playbackUrl.match(/\.(mp4|webm|m3u8|mov|mkv)($|\?)/i)
  );

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Main Video Stage */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232334] shadow-2xl">
          {isVerifying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d14] text-gray-400 space-y-3">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono tracking-wider">Verifying Cultivator Dao Privileges...</p>
            </div>
          ) : accessGranted && playbackUrl ? (
            <div className="relative w-full h-full">
              {isEmbedPlayer ? (
                /* AVCaption Responsive Embed Player */
                <iframe
                  src={playbackUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  title={video.title}
                />
              ) : (
                /* Direct Stream Fallback Player */
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
              )}

              {/* Dynamic Resume Toast Overlay */}
              {resumeToast && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl">
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
            /* Stream Loading / Connecting State */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-gray-400">Connecting to High-Speed Video Stream...</p>
            </div>
          )}
        </div>

        {/* SECTION: SERIES EPISODES NUMERICAL LIST (Requirement 7) */}
        {seriesEpisodes.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f0f18] border border-[#232338] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {video.seriesName || video.donghuaName} — Episodes ({seriesEpisodes.length})
                </h2>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Sorted Numerically</span>
            </div>

            {/* Episode Chips / Horizontal Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {seriesEpisodes.map((ep) => {
                const isCurrent = ep.id === video.id;
                const isFree = ep.accessType === 'free';

                return (
                  <Link
                    key={ep.id}
                    href={`/watch/${ep.id}`}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition-all flex items-center gap-2 shrink-0 ${
                      isCurrent
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : 'bg-[#151522] hover:bg-[#1f1f32] text-gray-200 border-[#2b2b42]'
                    }`}
                  >
                    <Play className={`w-3 h-3 ${isCurrent ? 'fill-black text-black' : 'text-amber-400'}`} />
                    <span>Ep {ep.episodeNumber}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-sans ${
                        isCurrent ? 'bg-black/20 text-black' : 'bg-emerald-950/70 text-emerald-300'
                      }`}
                    >
                      FREE
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Info & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#1c1c2a]">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded bg-red-950/60 border border-red-800/50 text-red-300 font-bold uppercase">
                {video.seriesName || video.donghuaName}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#181824] text-amber-400 font-mono">
                Season {video.seasonNumber || 1} • Episode {video.episodeNumber || 1}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#181824] text-gray-400">
                {video.language || 'Hindi Dubbed'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] uppercase">
                FREE STREAM
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-gray-300 font-mono text-[10px]">
                AVCaption Hosted
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {video.title}
            </h1>

            {/* Stream Features Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Resolution</p>
                  <p className="text-xs font-bold text-white font-mono truncate">
                    1080p FHD / 4K
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Experience</p>
                  <p className="text-xs font-bold text-white truncate">
                    100% Free &amp; Ad-Free
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Offline</p>
                  <p className="text-xs font-bold text-white truncate">
                    {video.downloadAllowed ? 'Allowed' : 'Stream Only'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#12121c] border border-[#202030] flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">Audio Track</p>
                  <p className="text-xs font-bold text-white truncate">
                    {video.audio || video.language || 'Hindi Dubbed'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl pt-1">
              {video.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#15151f] border border-[#29293d] text-gray-300 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{copyToast ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#212130] to-[#2c2c42] hover:border-amber-500/60 border border-[#393952] text-amber-300 transition-all shadow-md"
            >
              {downloadLoading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Section: Video Comments & Discussion (Requirement 10) */}
        <div className="mt-8">
          <VideoComments videoId={video.id} />
        </div>

        {/* More Donghua Sagas */}
        {otherVideos.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                Other Donghua Sagas
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {otherVideos.map((rel) => (
                <VideoCard key={rel.id} video={rel} />
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
