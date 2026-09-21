'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { VideoItem, ContentType, PublishingStatus, AccessType, RequiredPlan, RightsStatusType } from '@/lib/types';
import { DonghuaLogo, ChineseCloudPattern } from './DonghuaLogo';
import {
  Upload,
  Film,
  Layers,
  Sparkles,
  Clapperboard,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  Calendar,
  Clock,
  ShieldCheck,
  Download,
  Flame,
  Radio,
  FileVideo,
  FileImage,
  X,
  ChevronRight,
  Info,
  Check,
  ArrowLeft,
  Crown,
  Play,
  Share2,
} from 'lucide-react';

interface UploadContentDashboardProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onSuccessRedirect?: (videoId: string) => void;
  isModal?: boolean;
}

const AVAILABLE_GENRES = [
  'Action',
  'Fantasy',
  'Cultivation',
  'Adventure',
  'Martial Arts',
  'Xianxia',
  'Romance',
  'Drama',
  'Comedy',
  'Mystery',
  'Reincarnation',
  'Historical',
];

const LANGUAGE_OPTIONS = [
  'Hindi Dubbed',
  'Chinese (Mandarin)',
  'Hindi + English Sub',
  'Chinese + Hindi Subtitles',
  'English Dubbed',
  'Multi-Audio (Hindi/Chinese)',
  'Other',
];

const AUDIO_OPTIONS = [
  'Hindi Dubbed',
  'Original (Chinese)',
  'English Dubbed',
  'Multiple Audio Tracks',
];

const SUBTITLE_OPTIONS = [
  'Hindi, English',
  'Hindi',
  'English',
  'Chinese',
  'Multiple Subtitles',
  'None',
];

export function UploadContentDashboard({
  onCancel,
  onSuccess,
  onSuccessRedirect,
  isModal = false,
}: UploadContentDashboardProps) {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();

  // Content Type
  const [contentType, setContentType] = useState<ContentType>('episode');

  // Series Information
  const [donghuaTitle, setDonghuaTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Cultivation', 'Action']);
  const [language, setLanguage] = useState('Hindi Dubbed');
  const [audio, setAudio] = useState('Hindi Dubbed');
  const [subtitles, setSubtitles] = useState('Hindi, English');
  const [duration, setDuration] = useState('22:30');

  // Media: Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState(
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80'
  );
  const [posterUrl, setPosterUrl] = useState('');
  const [thumbnailFileName, setThumbnailFileName] = useState('');
  const [cropPreviewMode, setCropPreviewMode] = useState<'16:9' | 'banner'>('16:9');
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  // Media: Video Upload
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState('soul_land_ep1_hindi_master.mp4');
  const [videoFileSize, setVideoFileSize] = useState('420 MB');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(true);
  const [videoProcessed, setVideoProcessed] = useState(true);
  const [readyToPublish, setReadyToPublish] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Access / Payment Settings
  const [accessType, setAccessType] = useState<AccessType>('subscription');
  const [requiredPlan, setRequiredPlan] = useState<RequiredPlan>('basic');

  // Download & Ads
  const [downloadPermission, setDownloadPermission] = useState(false);
  const [adSetting, setAdSetting] = useState<'show' | 'hide'>('show');

  // Publishing Status & Flags
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus>('published');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(true);
  const [isNewEpisode, setIsNewEpisode] = useState(true);

  // Content Rights
  const [rightsStatus, setRightsStatus] = useState<RightsStatusType>('Licensed');
  const [licenseReference, setLicenseReference] = useState('DA-SAARC-2026-DISTRIB');
  const [licenseStartDate, setLicenseStartDate] = useState('2026-01-01');
  const [licenseEndDate, setLicenseEndDate] = useState('2028-12-31');
  const [territory, setTerritory] = useState('India, South Asia (SAARC)');

  // Flow Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedVideo, setSubmittedVideo] = useState<VideoItem | null>(null);
  const [successState, setSuccessState] = useState<'published' | 'draft' | null>(null);

  const handleSelectAccessType = (type: AccessType) => {
    setAccessType(type);
    if (type === 'free') {
      setRequiredPlan('free');
      setDownloadPermission(false);
      setAdSetting('show');
      setAudio('Hindi Dubbed');
    } else if (type === 'subscription') {
      setRequiredPlan('basic');
      setDownloadPermission(false);
      setAdSetting('show');
      setAudio('Hindi Dubbed');
    } else if (type === 'exclusive') {
      setRequiredPlan('premium');
      setDownloadPermission(true);
      setAdSetting('hide');
      setAudio('Multiple Audio Tracks');
    } else if (type === 'vip') {
      setRequiredPlan('vip');
      setDownloadPermission(true);
      setAdSetting('hide');
      setAudio('Multiple Audio Tracks');
    }
  };

  const handleApplyPresetVideo = (presetName: string, size: string) => {
    setVideoFileName(presetName);
    setVideoFileSize(size);
    setUploadProgress(100);
    setProcessingProgress(100);
    setVideoUploaded(true);
    setVideoProcessed(true);
    setReadyToPublish(true);
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Thumbnail file selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnailUrl(reader.result);
        if (!posterUrl) setPosterUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Video file selection and upload simulation
  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    setVideoFileName(file.name);
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    setUploadError(null);
    setVideoUploaded(false);
    setVideoProcessed(false);
    setReadyToPublish(false);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (!prev) return 20;
        if (prev >= 90) {
          clearInterval(interval);
          setVideoUploaded(true);
          setProcessingProgress(25);
          // simulate processing
          const procInterval = setInterval(() => {
            setProcessingProgress((proc) => {
              if (!proc) return 40;
              if (proc >= 90) {
                clearInterval(procInterval);
                setProcessingProgress(100);
                setVideoProcessed(true);
                setReadyToPublish(true);
                return 100;
              }
              return proc + 35;
            });
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setThumbnailFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setThumbnailUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler
  const executePublishOrDraft = async (statusOverride?: PublishingStatus) => {
    const finalStatus = statusOverride || publishingStatus;

    if (!donghuaTitle.trim()) {
      alert('Please enter Donghua Series Title');
      return;
    }

    setIsSubmitting(true);

    const videoData: Partial<VideoItem> = {
      title: episodeTitle.trim() || `${donghuaTitle} - Ep ${episodeNumber}`,
      donghuaName: donghuaTitle.trim(),
      description: fullDescription.trim() || shortDescription.trim() || 'Exciting cultivation battle and martial realms unfolding.',
      shortDescription: shortDescription.trim(),
      contentType,
      episodeNumber: Number(episodeNumber),
      seasonNumber: Number(seasonNumber),
      thumbnailUrl,
      posterUrl: posterUrl || thumbnailUrl,
      videoStoragePath: `videos/${donghuaTitle.toLowerCase().replace(/\s+/g, '-')}/ep${episodeNumber}.mp4`,
      videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      accessType,
      requiredPlan,
      duration: duration || '22:30',
      category: selectedGenres[0] || 'Cultivation',
      genre: selectedGenres[0] || 'Cultivation',
      genres: selectedGenres,
      language,
      audio,
      subtitles,
      tags: [...selectedGenres, donghuaTitle, contentType],
      published: finalStatus !== 'draft',
      status: finalStatus,
      scheduledDate: finalStatus === 'scheduled' ? scheduledDate : undefined,
      scheduledTime: finalStatus === 'scheduled' ? scheduledTime : undefined,
      isFeatured,
      isTrending,
      isNewEpisode,
      downloadAllowed: downloadPermission,
      adsAllowed: adSetting === 'show',
      rightsStatus,
      licenseInfo: licenseReference,
      licenseStartDate,
      licenseEndDate,
      territory,
      fileName: videoFileName,
      fileSize: videoFileSize,
    };

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          adminRole: profile?.role || 'admin',
          videoData,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save content on server.');
      }

      setSubmittedVideo(data.video);
      setSuccessState(finalStatus === 'draft' ? 'draft' : 'published');
      setShowConfirmPublish(false);
      setShowPreviewModal(false);
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err.message || 'Error occurred while saving content.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for next upload
  const resetForm = () => {
    setEpisodeNumber((prev) => prev + 1);
    setEpisodeTitle('');
    setShortDescription('');
    setFullDescription('');
    setSuccessState(null);
    setSubmittedVideo(null);
  };

  // SUCCESS SCREEN
  if (successState && submittedVideo) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl p-8 rounded-3xl bg-[#0e0e16] border border-[#2c2c40] shadow-[0_0_60px_rgba(201,42,42,0.25)] text-center space-y-6 relative overflow-hidden">
          <ChineseCloudPattern />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-950 to-[#101b13] border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2 relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              {successState === 'published' ? 'Decent Animation Live Stream' : 'Admin Draft Repository'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
              {successState === 'published' ? 'Content Published Successfully' : 'Draft Saved'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              {successState === 'published'
                ? 'Your content is now available on Decent Animation with verified DRM access rules.'
                : 'Episode draft has been saved to your administration library. You can review and publish anytime.'}
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-2xl bg-[#141420] border border-[#242436] flex items-center gap-4 text-left relative z-10">
            <img
              src={submittedVideo.thumbnailUrl}
              alt={submittedVideo.title}
              className="w-20 h-14 object-cover rounded-xl border border-[#343448] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-amber-400 font-mono truncate">{submittedVideo.donghuaName}</p>
              <h4 className="text-sm font-bold text-white truncate">{submittedVideo.title}</h4>
              <p className="text-[11px] text-gray-400">
                S{submittedVideo.seasonNumber} • EP{submittedVideo.episodeNumber} • {submittedVideo.accessType.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
            {successState === 'published' && (
              <Link
                href={`/watch/${submittedVideo.id}`}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                View Content
              </Link>
            )}
            <button
              onClick={resetForm}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#1c1c2b] hover:bg-[#28283d] border border-[#35354e] flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Upload Another
            </button>
            <button
              onClick={() => {
                if (onCancel) onCancel();
                else router.push('/admin');
              }}
              className="py-3 px-4 rounded-xl font-semibold text-xs text-gray-300 bg-[#161622] hover:text-white"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-gray-200">
      {/* Top Atmospheric Header */}
      <div className="mb-6 sm:mb-8 pb-6 border-b border-[#1f1f2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Decent Animation • Donghua Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight mt-1">
            Upload New Content
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Add a new Donghua, episode, movie or series to Decent Animation.
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Main Grid: Responsive 1-Column on Mobile, 2-Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pb-24 lg:pb-8">
        {/* ============================================================ */}
        {/* LEFT COLUMN (Desktop col-span-7): Content & Metadata         */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 3: CONTENT TYPE */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg relative overflow-hidden">
            <ChineseCloudPattern />
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">
              1. Content Type
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              {[
                {
                  id: 'series' as ContentType,
                  title: 'Donghua Series',
                  desc: 'Create a complete Donghua series.',
                  icon: Tv,
                },
                {
                  id: 'episode' as ContentType,
                  title: 'Episode',
                  desc: 'Add an episode to an existing series.',
                  icon: Clapperboard,
                },
                {
                  id: 'movie' as ContentType,
                  title: 'Movie',
                  desc: 'Upload a standalone movie.',
                  icon: Film,
                },
                {
                  id: 'special' as ContentType,
                  title: 'Special',
                  desc: 'Upload special/exclusive content.',
                  icon: Sparkles,
                },
              ].map((card) => {
                const Icon = card.icon;
                const isSelected = contentType === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setContentType(card.id)}
                    className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#24151b] to-[#160f14] border-red-500/80 shadow-[0_0_15px_rgba(201,42,42,0.3)] text-white'
                        : 'bg-[#141420] border-[#222234] text-gray-400 hover:text-gray-200 hover:bg-[#181826]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-gray-400'}`} />
                      {isSelected && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{card.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: SERIES INFORMATION */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b1b2a] pb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-amber-400">
                2. Series Information
              </label>
              <span className="text-[11px] text-gray-500 font-mono">* Required fields</span>
            </div>

            {/* Donghua Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Donghua Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={donghuaTitle}
                onChange={(e) => setDonghuaTitle(e.target.value)}
                placeholder="Example: Battle Through the Heavens (Doupo Cangqiong)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Season, Episode #, Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Season</label>
                <input
                  type="number"
                  min={1}
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(Number(e.target.value))}
                  placeholder="Season 1"
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Episode Number</label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  placeholder="Episode 01"
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="22:30"
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Episode Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Episode Title</label>
              <input
                type="text"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                placeholder="Example: The Beginning: Flame Awakening"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Short Description (Catchphrase)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief one-line hook for browse cards and mobile preview"
                className="w-full px-3.5 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Description</label>
              <textarea
                rows={3}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Elaborate synopsis, battle arcs, breakthrough cultivations, and character revelations..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
              />
            </div>

            {/* Multi-select Genres */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Genre <span className="text-gray-400 font-normal">(Multi-select)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-red-900/60 text-amber-300 border border-red-500/60 shadow-sm'
                          : 'bg-[#161624] text-gray-400 border border-[#242436] hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language, Audio, Subtitles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Audio</label>
                <select
                  value={audio}
                  onChange={(e) => setAudio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  {AUDIO_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subtitles</label>
                <select
                  value={subtitles}
                  onChange={(e) => setSubtitles(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  {SUBTITLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 11: CONTENT RIGHTS / LICENSE INFORMATION */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b1b2a] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  3. Content Rights (Admin Only)
                </label>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                Never shown publicly
              </span>
            </div>

            {/* Warning Banner */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Only publish content that you have the legal right or authorization to distribute.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Rights Status</label>
                <select
                  value={rightsStatus}
                  onChange={(e) => setRightsStatus(e.target.value as RightsStatusType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="Licensed">Licensed</option>
                  <option value="Owned">Owned</option>
                  <option value="Authorized">Authorized</option>
                  <option value="Pending Verification">Pending Verification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  License / Authorization Reference
                </label>
                <input
                  type="text"
                  value={licenseReference}
                  onChange={(e) => setLicenseReference(e.target.value)}
                  placeholder="e.g. Contract DA-2026-SAARC-01"
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  License Start Date
                </label>
                <input
                  type="date"
                  value={licenseStartDate}
                  onChange={(e) => setLicenseStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  License End Date
                </label>
                <input
                  type="date"
                  value={licenseEndDate}
                  onChange={(e) => setLicenseEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Territory</label>
                <input
                  type="text"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="India, SAARC"
                  className="w-full px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (Desktop col-span-5): Media, Access & Publish  */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-6">
          {/* SECTION 5: THUMBNAIL / POSTER */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b1b2a] pb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-amber-400">
                4. Thumbnail / Poster (16:9)
              </label>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCropPreviewMode('16:9')}
                  className={`px-2 py-0.5 rounded ${
                    cropPreviewMode === '16:9'
                      ? 'bg-red-950 text-red-300 border border-red-600/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  16:9
                </button>
                <button
                  type="button"
                  onClick={() => setCropPreviewMode('banner')}
                  className={`px-2 py-0.5 rounded ${
                    cropPreviewMode === 'banner'
                      ? 'bg-red-950 text-red-300 border border-red-600/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Banner
                </button>
              </div>
            </div>

            {/* Drag & Drop Thumbnail Box */}
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDrop={handleThumbnailDrop}
                onClick={() => thumbnailInputRef.current?.click()}
                className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-[#2d2d42] hover:border-amber-500/70 bg-[#12121c] p-4 text-center transition-all overflow-hidden"
              >
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                />

                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <div
                      className={`relative w-full rounded-xl overflow-hidden border border-[#2d2d42] ${
                        cropPreviewMode === '16:9' ? 'aspect-video' : 'h-28'
                      }`}
                    >
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white">
                        Click or drag to change image
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                      <span className="truncate max-w-[200px]">{thumbnailFileName || 'Default Donghua Art'}</span>
                      <span className="text-amber-400 font-mono">16:9 Optimized</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#1b1b2a] flex items-center justify-center text-amber-400">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white">Drop thumbnail here</p>
                    <p className="text-[11px] text-gray-400">or click to Choose Thumbnail</p>
                    <p className="text-[10px] text-gray-500 font-mono">JPG, JPEG, PNG, WEBP</p>
                  </div>
                )}
              </div>

              {/* Explicit Thumbnail Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#1a1a28] hover:bg-[#252538] border border-[#2e2e42] text-xs font-bold text-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Upload Thumbnail Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80');
                    setThumbnailFileName('soul_land_cultivation_poster.jpg');
                  }}
                  className="py-2 px-3 rounded-xl bg-[#141420] hover:bg-[#1c1c2c] border border-[#252538] text-[11px] font-medium text-gray-400 hover:text-white"
                >
                  Reset Art
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: VIDEO UPLOAD */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b1b2a] pb-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-red-500" />
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  5. Video Upload &amp; Master File
                </label>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">MP4, WEBM, MKV, MOV</span>
            </div>

            {/* Video File Selector & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleVideoDrop}
              onClick={() => videoInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-[#2d2d42] hover:border-amber-500/70 bg-[#12121c] p-5 text-center transition-all group"
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleVideoSelect(e.target.files[0]);
                }}
              />

              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-950/80 to-[#181016] border border-red-600/50 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform shadow-lg">
                  <Upload className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Click to Select Video File</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Drag & drop your master video file here</p>
                </div>

                {/* Progress Display */}
                {uploadProgress !== null && uploadProgress < 100 && (
                  <div className="pt-2 space-y-1.5 text-left max-w-md mx-auto">
                    <div className="flex justify-between text-[11px] font-mono text-gray-300">
                      <span>Uploading Video Stream...</span>
                      <span className="text-amber-400 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1e1e2d] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Video Info & Status Flags */}
                <div className="p-3.5 rounded-xl bg-[#171724] border border-[#28283a] text-left space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono text-white font-bold truncate max-w-[220px]">{videoFileName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300 bg-[#212130] px-2 py-0.5 rounded border border-[#323246]">{videoFileSize}</span>
                  </div>

                  <div className="pt-2 border-t border-[#232336] grid grid-cols-3 gap-1.5 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-[#121c15] px-2 py-1 rounded border border-emerald-800/40">
                      <Check className="w-3 h-3" />
                      <span className="text-[10px]">Uploaded</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-[#121c15] px-2 py-1 rounded border border-emerald-800/40">
                      <Check className="w-3 h-3" />
                      <span className="text-[10px]">1080p/4K Transcoded</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 bg-[#1e1a12] px-2 py-1 rounded border border-amber-800/40">
                      <Check className="w-3 h-3" />
                      <span className="text-[10px]">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explicit Action Buttons in Video Upload Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(201,42,42,0.35)] transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose / Upload Video File</span>
                </button>

                {/* Final Upload & Publish Button inside Upload Section */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPublish(true)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#1c1c2c] hover:bg-[#28283e] border border-amber-500/60 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Final Upload &amp; Publish</span>
                </button>
              </div>

              {/* Quick Master Presets for instant testing */}
              <div className="p-3 rounded-xl bg-[#13131e] border border-[#222234] space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  Quick Master File Presets (Instant Upload):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetVideo('BTTH_S05_EP12_HindiDub_1080pFHD.mp4', '480 MB')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#191926] hover:bg-[#222236] border border-[#2e2e42] text-[11px] text-left text-gray-300 hover:text-white font-mono flex items-center justify-between"
                  >
                    <span>1080p Master</span>
                    <span className="text-amber-400 font-bold text-[10px]">480 MB</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetVideo('SoulLand_S01_EP44_4K_60fps_HDR.mp4', '1.2 GB')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#191926] hover:bg-[#222236] border border-[#2e2e42] text-[11px] text-left text-gray-300 hover:text-white font-mono flex items-center justify-between"
                  >
                    <span>4K Ultra HD</span>
                    <span className="text-amber-400 font-bold text-[10px]">1.2 GB</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetVideo('PerfectWorld_Ep88_MultiAudio_Master.mp4', '390 MB')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#191926] hover:bg-[#222236] border border-[#2e2e42] text-[11px] text-left text-gray-300 hover:text-white font-mono flex items-center justify-between"
                  >
                    <span>Multi-Audio RAW</span>
                    <span className="text-amber-400 font-bold text-[10px]">390 MB</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: ACCESS & PLAN FEATURES */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <div className="border-b border-[#1b1b2a] pb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-amber-400">
                6. Plan Access &amp; Feature Delivery Rules
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Configure stream quality, ad delivery, and download permissions according to viewer subscription tiers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'free' as AccessType,
                  title: 'FREE',
                  subtitle: 'Public access tier.',
                  rules: [
                    '○ Stream: 480p / 720p HD',
                    '○ Video Ads: Enabled',
                    '○ Downloads: Disabled',
                    '○ Audio: Standard Stereo',
                  ],
                  badge: 'Public',
                  badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
                },
                {
                  id: 'subscription' as AccessType,
                  title: 'BASIC (₹59)',
                  subtitle: 'Basic Monthly subscribers.',
                  rules: [
                    '○ Stream: 1080p Full HD',
                    '○ Video Ads: Standard Ads',
                    '○ Downloads: Optional',
                    '○ Audio: Hindi Dub / Stereo',
                  ],
                  badge: 'Basic Tier',
                  badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/40',
                },
                {
                  id: 'exclusive' as AccessType,
                  title: 'PREMIUM (₹99+)',
                  subtitle: 'Premium & Quarterly members.',
                  rules: [
                    '○ Stream: 1080p FHD / 2K',
                    '○ Video Ads: 100% Ad-Free',
                    '○ Downloads: Unlocked',
                    '○ Multi-Audio: Hindi + Mandarin',
                  ],
                  badge: 'Exclusive',
                  badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
                },
                {
                  id: 'vip' as AccessType,
                  title: 'VIP (₹999)',
                  subtitle: 'VIP Yearly Cultivator Plan.',
                  rules: [
                    '○ Stream: 4K Ultra HD 60fps',
                    '○ Video Ads: Zero Ads Guaranteed',
                    '○ Downloads: Unlimited High-Speed',
                    '○ Early Access: Priority Unlocked',
                  ],
                  badge: 'VIP Only',
                  badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
                },
              ].map((tier) => {
                const isSelected = accessType === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handleSelectAccessType(tier.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#231217] to-[#140e13] border-red-500/80 shadow-[0_0_15px_rgba(201,42,42,0.3)]'
                        : 'bg-[#141420] border-[#222234] hover:bg-[#181826]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white tracking-wider">{tier.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${tier.badgeColor}`}>
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">{tier.subtitle}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#202030] space-y-0.5">
                      {tier.rules.map((r, i) => (
                        <p key={i} className="text-[10px] text-gray-300 font-mono leading-tight">
                          {r}
                        </p>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Plan Feature Summary & Upload Button */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#1c1218] via-[#15121b] to-[#12121e] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Active Plan Mode: <span className="text-amber-400 uppercase font-mono">{accessType}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {accessType === 'vip' ? '4K UltraHD • No Ads • Downloads' : accessType === 'exclusive' ? '1080p FHD • Ad-Free • Downloads' : accessType === 'subscription' ? '1080p FHD • Limited Ads' : '720p HD • Standard Ads'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmPublish(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(201,42,42,0.4)] transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload &amp; Publish with {accessType.toUpperCase()} Tier Features</span>
                </button>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 border-b border-[#1b1b2a] pb-3">
              7. Download &amp; Advertising Settings
            </label>

            {/* Download Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141420] border border-[#222234]">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Permission</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {downloadPermission
                    ? 'Users with eligible Premium/VIP plans can download this content.'
                    : 'Offline downloads are disabled for this episode.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDownloadPermission(!downloadPermission)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  downloadPermission ? 'bg-red-600' : 'bg-[#2a2a3c]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    downloadPermission ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Ad Settings */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141420] border border-[#222234]">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Advertisement Settings</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  VIP users never see ads. Override standard ad delivery for this video.
                </p>
              </div>
              <div className="flex gap-1 bg-[#0c0c14] p-1 rounded-xl border border-[#252538] shrink-0">
                <button
                  type="button"
                  onClick={() => setAdSetting('show')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    adSetting === 'show' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Show Ads
                </button>
                <button
                  type="button"
                  onClick={() => setAdSetting('hide')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    adSetting === 'hide' ? 'bg-red-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Hide Ads
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 10: PUBLISH SETTINGS & PROMOTIONAL FLAGS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f0f18] border border-[#202032] shadow-lg space-y-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 border-b border-[#1b1b2a] pb-3">
              8. Publishing Status &amp; Promotion
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(['published', 'draft', 'scheduled'] as PublishingStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPublishingStatus(st)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    publishingStatus === st
                      ? 'bg-red-900/60 text-amber-300 border-red-500/80 shadow-md'
                      : 'bg-[#141420] text-gray-400 border-[#222234] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Scheduled Fields */}
            {publishingStatus === 'scheduled' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#141420] border border-[#26263a]">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0e16] border border-[#2c2c40] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Release Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0e16] border border-[#2c2c40] text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Featured, Trending, New Episode Toggles */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Featured', active: isFeatured, toggle: () => setIsFeatured(!isFeatured) },
                { label: 'Trending', active: isTrending, toggle: () => setIsTrending(!isTrending) },
                { label: 'New Episode', active: isNewEpisode, toggle: () => setIsNewEpisode(!isNewEpisode) },
              ].map((flag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={flag.toggle}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                    flag.active
                      ? 'bg-[#1f1624] text-amber-300 border-amber-500/50'
                      : 'bg-[#141420] text-gray-400 border-[#222234] hover:text-white'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${flag.active ? 'bg-amber-400' : 'bg-gray-600'}`}
                  />
                  <span>{flag.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 15: DESKTOP & MOBILE BOTTOM ACTIONS                   */}
      {/* ============================================================ */}
      {/* Sticky Bottom Action Bar for Mobile and Floating Bar for Desktop */}
      <div className="fixed lg:sticky bottom-0 left-0 right-0 z-40 bg-[#0c0c14]/95 backdrop-blur-lg border-t border-[#202030] p-4 lg:p-5 lg:rounded-2xl lg:mt-6 lg:border shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Target Status:{' '}
              <strong className="text-white uppercase font-mono">{publishingStatus}</strong>
            </span>
            <span className="text-xs text-gray-400">
              Access Tier:{' '}
              <strong className="text-amber-400 uppercase font-mono">{accessType}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="py-2.5 px-4 rounded-xl bg-[#1a1a2a] hover:bg-[#25253a] text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              Preview Content
            </button>

            <button
              type="button"
              onClick={() => executePublishOrDraft('draft')}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-[#1c1c2b] hover:bg-[#27273c] text-white text-xs font-bold border border-[#35354e] transition-colors"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmPublish(true)}
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_20px_rgba(201,42,42,0.4)] transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Publish Content
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 12: PREVIEW CONTENT MODAL                            */}
      {/* ============================================================ */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0e0e16] border border-[#29293e] shadow-2xl p-6 sm:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#202030] pb-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400">
                <Eye className="w-4 h-4" />
                <span>Preview Content</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-video rounded-xl overflow-hidden border border-[#252538] relative">
                <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-700/80 text-white font-mono text-[10px] uppercase font-bold">
                  {accessType}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono text-amber-400">{donghuaTitle || 'Untitled Series'}</span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {episodeTitle || `Episode ${episodeNumber}`}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3">
                  {fullDescription || shortDescription || 'No description provided.'}
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded bg-[#1c1c2b] text-[10px] font-medium text-gray-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#141420] border border-[#222234] text-xs">
              <div>
                <p className="text-gray-400 text-[10px]">Season / Episode</p>
                <p className="font-bold text-white font-mono">
                  S{seasonNumber} • EP{episodeNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Language</p>
                <p className="font-bold text-white truncate">{language}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Downloads</p>
                <p className="font-bold text-emerald-400 font-mono">
                  {downloadPermission ? 'Allowed' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Ads Mode</p>
                <p className="font-bold text-amber-400 font-mono">
                  {adSetting === 'show' ? 'Standard Ads' : 'Ad-Free'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1a1a28] hover:bg-[#252538] text-xs font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  executePublishOrDraft('draft');
                }}
                className="px-4 py-2 rounded-xl bg-[#1c1c2b] text-xs font-bold text-white border border-[#303048]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowConfirmPublish(true);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-xs font-bold text-white hover:brightness-110 shadow-lg"
              >
                Publish Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: Publish this content? */}
      {showConfirmPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#0e0e16] border border-[#2b2b3e] p-6 text-center space-y-4 shadow-2xl text-white">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-600/50 flex items-center justify-center text-amber-400">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Publish this content?</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This episode will be made available to viewers on Decent Animation according to the{' '}
              <strong className="text-amber-400">{accessType.toUpperCase()}</strong> tier rules.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmPublish(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#181826] hover:bg-[#222234] text-xs font-semibold text-gray-300"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => executePublishOrDraft('published')}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-xs font-bold text-white shadow-lg"
              >
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
