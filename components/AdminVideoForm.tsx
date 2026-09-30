'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VideoItem, RequiredPlan, ContentType, PublishingStatus, AccessType, SUBSCRIPTION_PLANS } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { validateAvCaptionEmbedUrl } from '@/lib/video-service';
import {
  Upload,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  ShieldCheck,
  ChevronDown,
  Play,
  RotateCcw,
  Trash2,
  Save,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface AdminVideoFormProps {
  initialVideo?: VideoItem | null;
  onSuccess?: (video: VideoItem) => void;
  onCancel?: () => void;
  existingSeriesList?: string[];
}

const AVAILABLE_GENRES = [
  'Cultivation',
  'Xianxia',
  'Martial Arts',
  'Action',
  'Fantasy',
  'Reincarnation',
  'Adventure',
  'Romance',
  'Drama',
  'Comedy',
  'Historical',
];

const LANGUAGE_OPTIONS = [
  'Hindi Dubbed',
  'Chinese (Mandarin)',
  'Hindi + English Sub',
  'Chinese + Hindi Subtitles',
  'English Dubbed',
  'Multi-Audio (Hindi / Chinese)',
];

const DEFAULT_THUMBNAILS = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
];

export function AdminVideoForm({
  initialVideo,
  onSuccess,
  onCancel,
  existingSeriesList = ['Battle Through the Heavens (Doupo Cangqiong)', 'Soul Land (Douluo Dalu)', 'Renegade Immortal (Xian Ni)', 'Perfect World (Wanmei Shijie)', 'A Will Eternal (Yi Nian Yong Heng)'],
}: AdminVideoFormProps) {
  const { user, profile } = useAuth();
  const isEditMode = Boolean(initialVideo?.id);

  // Form Fields
  const [seriesName, setSeriesName] = useState(initialVideo?.seriesName || initialVideo?.donghuaName || '');
  const [title, setTitle] = useState(initialVideo?.title || '');
  const [episodeNumber, setEpisodeNumber] = useState<number>(initialVideo?.episodeNumber || 1);
  const [seasonNumber, setSeasonNumber] = useState<number>(initialVideo?.seasonNumber || 1);
  const [description, setDescription] = useState(initialVideo?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialVideo?.thumbnailUrl || DEFAULT_THUMBNAILS[0]);
  const [embedUrl, setEmbedUrl] = useState(initialVideo?.embedUrl || initialVideo?.avcaptionUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialVideo?.videoUrl || initialVideo?.videoStreamUrl || '');
  const [videoType, setVideoType] = useState<ContentType>(
    (initialVideo?.videoType as ContentType) || (initialVideo?.contentType as ContentType) || 'episode'
  );
  const [accessType, setAccessType] = useState<AccessType>(initialVideo?.accessType || 'free');
  const [requiredPlan, setRequiredPlan] = useState<string>(initialVideo?.requiredPlan || 'basic');
  const [genre, setGenre] = useState(initialVideo?.genre || initialVideo?.category || 'Cultivation');
  const [language, setLanguage] = useState(initialVideo?.language || 'Hindi Dubbed');
  const [subtitles, setSubtitles] = useState(initialVideo?.subtitles || 'Hindi, English');
  const [releaseDate, setReleaseDate] = useState(
    initialVideo?.releaseDate || new Date().toISOString().split('T')[0]
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    initialVideo ? initialVideo.published !== false && initialVideo.status !== 'draft' : true
  );

  // Status & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-fill title helper when series & episode change and title is blank or follows pattern
  const handleSeriesChange = (val: string) => {
    setSeriesName(val);
    if (!title || title.includes('Episode') || title === '') {
      setTitle(`${val.trim()} Episode ${episodeNumber}`);
    }
  };

  const handleEpisodeChange = (ep: number) => {
    setEpisodeNumber(ep);
    if (!title || (seriesName && title.startsWith(seriesName.trim()))) {
      setTitle(`${seriesName.trim()} Episode ${ep}`);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!seriesName.trim()) {
      setErrorMessage('Please enter the Series Name.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a Video Title.');
      return;
    }
    const embedValidation = validateAvCaptionEmbedUrl(embedUrl);
    if (!embedValidation.valid) {
      setErrorMessage(embedValidation.error || 'Please enter a valid AVCaption embed URL.');
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<VideoItem> = {
      id: initialVideo?.id,
      title: title.trim(),
      seriesName: seriesName.trim(),
      donghuaName: seriesName.trim(),
      episodeNumber: Number(episodeNumber) || 1,
      seasonNumber: Number(seasonNumber) || 1,
      description: description.trim() || `${seriesName.trim()} - Episode ${episodeNumber}`,
      shortDescription: description.trim().slice(0, 150),
      thumbnailUrl: thumbnailUrl.trim() || DEFAULT_THUMBNAILS[0],
      posterUrl: thumbnailUrl.trim() || DEFAULT_THUMBNAILS[0],
      embedUrl: embedUrl.trim(),
      avcaptionUrl: embedUrl.trim(),
      videoUrl: videoUrl.trim() || embedUrl.trim(),
      videoStreamUrl: videoUrl.trim() || embedUrl.trim(),
      contentType: videoType,
      videoType: videoType as any,
      accessType: accessType,
      requiredPlan: accessType === 'free' ? 'free' : requiredPlan,
      genre: genre.trim(),
      category: genre.trim(),
      genres: [genre.trim()],
      language: language.trim(),
      audio: language.trim(),
      subtitles: subtitles.trim(),
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      published: isPublished,
      status: isPublished ? 'published' : 'draft',
    };

    try {
      const url = '/api/admin/videos';
      const method = isEditMode ? 'PUT' : 'POST';
      const bodyPayload = isEditMode
        ? {
            adminEmail: user?.email,
            adminRole: profile?.role || 'admin',
            videoId: initialVideo?.id,
            updates: payload,
          }
        : {
            adminEmail: user?.email,
            adminRole: profile?.role || 'admin',
            videoData: payload,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || '',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save video to Firebase.');
      }

      setSuccessMessage(
        isEditMode
          ? `Video "${title}" was successfully updated in Firebase Realtime Database!`
          : `Video "${title}" was successfully published to Firebase Realtime Database! It is now live on the website.`
      );

      if (!isEditMode) {
        // Reset form for adding another episode quickly
        setEpisodeNumber((prev) => prev + 1);
        setTitle(`${seriesName} Episode ${episodeNumber + 1}`);
        setEmbedUrl('');
        setVideoUrl('');
      }

      if (onSuccess && data.video) {
        onSuccess(data.video);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler (for edit mode)
  const handleDelete = async () => {
    if (!initialVideo?.id) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || '',
        },
        body: JSON.stringify({
          adminEmail: user?.email,
          adminRole: profile?.role || 'admin',
          videoId: initialVideo.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete video.');
      }

      if (onCancel) onCancel();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete video.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#0f0f18] border border-[#232338] shadow-2xl overflow-hidden">
      {/* Form Top Header */}
      <div className="p-5 sm:p-7 bg-gradient-to-r from-red-950/60 via-[#161624] to-[#12121e] border-b border-[#24243a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              {isEditMode ? 'Edit Video Metadata' : 'Add New AVCaption Video'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                RTDB Synced
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Host on AVCaption, store metadata in Firebase Realtime Database. Zero code changes required.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showLivePreview
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-[#181826] text-gray-300 hover:text-white border-[#2b2b40]'
            }`}
          >
            {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl bg-[#181826] hover:bg-[#202032] text-gray-400 hover:text-white text-xs border border-[#2b2b40]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="m-5 p-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">Validation Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="m-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">Saved to Firebase Realtime Database</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Live Preview Panel (When Enabled) */}
      {showLivePreview && (
        <div className="m-5 p-5 rounded-2xl bg-[#0c0c14] border border-amber-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-mono font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              LIVE VISITOR PREVIEW (AVCaption Player + Metadata)
            </span>
            <span className="text-gray-400">
              {accessType === 'free' ? 'FREE TO WATCH' : `REQUIRES: ${requiredPlan.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Embed Player Preview */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2b2b40] relative shadow-inner">
              {embedUrl.trim() ? (
                <iframe
                  src={embedUrl.trim()}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={title || 'Preview Player'}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center space-y-2">
                  <Play className="w-8 h-8 text-amber-500/50" />
                  <p className="text-xs">Paste AVCaption embed URL below to preview the video player here.</p>
                </div>
              )}
            </div>

            {/* Metadata Card Preview */}
            <div className="p-4 rounded-xl bg-[#141422] border border-[#232338] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono font-bold">
                  S{seasonNumber} E{episodeNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  {genre}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{language}</span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{title || 'Video Title Goes Here'}</h3>
              <p className="text-xs text-amber-400 font-semibold font-mono">{seriesName || 'Series Name'}</p>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {description || 'Episode description summary as seen by cultivators.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* SECTION 1: AVCAPTION EMBED (CRITICAL) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#161628] to-[#121220] border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              AVCaption Embed URL <span className="text-red-400">*</span>
            </label>
            <span className="text-[10px] text-gray-400 font-mono">No API Key Needed</span>
          </div>

          <input
            type="url"
            required
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://avcaption.com/embed/your-video-id"
            className="w-full px-4 py-3 rounded-xl bg-[#0b0b12] border border-[#2d2d44] text-white text-xs sm:text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Copy the <strong>Embed URL</strong> directly from your AVCaption video dashboard and paste it here. The video player will automatically render this embed in a responsive player.
          </p>

          {/* Optional Direct Stream / Video URL */}
          <div className="pt-2 border-t border-[#202034]">
            <label className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
              <span>AVCaption Video URL (Optional direct video link)</span>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Optional: https://avcaption.com/v/your-video-id or .mp4 fallback"
              className="mt-1.5 w-full px-3 py-2 rounded-xl bg-[#0b0b12] border border-[#242438] text-gray-200 text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* SECTION 2: SERIES & EPISODE ORGANIZATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Series Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Series Name <span className="text-red-400">*</span></span>
              <span className="text-[10px] text-gray-500 font-normal">Auto-grouped</span>
            </label>
            <input
              type="text"
              required
              value={seriesName}
              onChange={(e) => handleSeriesChange(e.target.value)}
              placeholder="e.g. Battle Through the Heavens (BTTH)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
            {/* Quick Series Suggestions */}
            {existingSeriesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-gray-500">Suggested:</span>
                {existingSeriesList.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSeriesChange(s)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a2c] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-[#2b2b40] transition-colors"
                  >
                    {s.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Video Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BTTH Episode 101: Flame Lotus Awakening"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Episode Number, Season Number, Video Type */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 uppercase">
              Episode # <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={episodeNumber}
              onChange={(e) => handleEpisodeChange(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white font-mono text-sm focus:outline-none focus:border-amber-500 text-center font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase">
              Season # (Opt)
            </label>
            <input
              type="number"
              min="1"
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white font-mono text-sm focus:outline-none focus:border-amber-500 text-center"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 uppercase">
              Type
            </label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as ContentType)}
              className="w-full px-2.5 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="episode">Episode</option>
              <option value="movie">Movie</option>
              <option value="special">Special</option>
            </select>
          </div>
        </div>

        {/* SECTION 3: ACCESS & SUBSCRIPTION REQUIREMENT */}
        <div className="p-4 rounded-2xl bg-[#141422] border border-[#232338] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Access &amp; Subscription Requirements
            </label>
            <span className="text-[10px] text-gray-400 font-mono">Enforced Server-Side</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccessType('free')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                accessType === 'free'
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : 'bg-[#181826] border-[#29293e] text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <p className="font-bold text-xs sm:text-sm">Free to Watch</p>
                <p className="text-[10px] text-gray-400">All registered users can watch</p>
              </div>
              {accessType === 'free' && <Check className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setAccessType('subscription')}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                accessType !== 'free'
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                  : 'bg-[#181826] border-[#29293e] text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <p className="font-bold text-xs sm:text-sm">Paid / Subscription</p>
                <p className="text-[10px] text-gray-400">Requires active subscriber plan</p>
              </div>
              {accessType !== 'free' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Required Plan Selection when Paid */}
          {accessType !== 'free' && (
            <div className="space-y-1.5 pt-2 border-t border-[#232338]">
              <label className="text-[11px] font-bold text-amber-300 uppercase">
                Choose Required Subscription Plan:
              </label>
              <select
                value={requiredPlan}
                onChange={(e) => setRequiredPlan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e18] border border-[#2b2b40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
              >
                <optgroup label="Tier Access">
                  <option value="basic">Basic Tier (₹59 / month &amp; above)</option>
                  <option value="premium">Premium Tier (₹99 / month &amp; above)</option>
                  <option value="vip">VIP Tier (₹999 / year exclusive)</option>
                </optgroup>
                <optgroup label="Specific Plan Assignment">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ₹{plan.price} {plan.durationLabel} ({plan.tier.toUpperCase()})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* SECTION 4: THUMBNAIL URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>Thumbnail Image URL</span>
            <span className="text-[10px] text-gray-500 font-normal">Stored by URL</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or paste image URL"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick preset thumbnail pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <span className="text-[10px] text-gray-500 shrink-0">Sample Presets:</span>
            {DEFAULT_THUMBNAILS.map((thumb, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setThumbnailUrl(thumb)}
                className={`w-12 h-7 rounded-lg overflow-hidden border shrink-0 transition-transform ${
                  thumbnailUrl === thumb ? 'ring-2 ring-amber-400 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={thumb} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 5: METADATA & DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs focus:outline-none focus:border-amber-500"
            >
              {AVAILABLE_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Language / Audio</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs focus:outline-none focus:border-amber-500"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Release Date</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Subtitles & Description */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Subtitles</label>
            <input
              type="text"
              value={subtitles}
              onChange={(e) => setSubtitles(e.target.value)}
              placeholder="e.g. Hindi, English"
              className="w-full px-3 py-2 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-300 uppercase">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter episode synopsis, martial soul battles, and cultivation lore..."
              className="w-full p-3 rounded-xl bg-[#141422] border border-[#27273c] text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 6: PUBLISH STATUS & SUBMIT BUTTON */}
        <div className="pt-4 border-t border-[#232338] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Published Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-center">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-[#141422] border-gray-700 focus:ring-amber-500"
            />
            <span className="text-xs font-bold text-white">
              {isPublished ? 'Status: Published (Visible to Visitors)' : 'Status: Draft (Hidden from Visitors)'}
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEditMode && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-300 text-xs font-bold border border-red-800/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 active:scale-98 text-white font-black text-sm shadow-xl shadow-red-900/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Video</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Publish Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#12121e] border border-red-500/50 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Confirm Deletion
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to remove <strong>"{title}"</strong> from the Firebase video catalogue?
            </p>
            <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 font-mono">
              Note: This removes the metadata from your website. It will <strong>NOT</strong> delete the hosted video on AVCaption.com.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#1a1a2c] hover:bg-[#25253e] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
