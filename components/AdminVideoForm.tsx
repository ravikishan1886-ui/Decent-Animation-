'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VideoItem, RequiredPlan, ContentType, PublishingStatus, AccessType, SUBSCRIPTION_PLANS } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { validateVideoUrl, slugifySeries } from '@/lib/video-service';
import { rtdb, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';
import {
  uploadVideoToStorage,
  uploadThumbnailToStorage,
  formatBytes,
  UploadProgress,
} from '@/lib/storage-service';
import {
  Upload,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Play,
  Trash2,
  Save,
  Check,
  FileVideo,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  X,
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

type UploadStage =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'saving_metadata'
  | 'completed'
  | 'error';

export function AdminVideoForm({
  initialVideo,
  onSuccess,
  onCancel,
  existingSeriesList = [
    'Battle Through the Heavens (Doupo Cangqiong)',
    'Soul Land (Douluo Dalu)',
    'Renegade Immortal (Xian Ni)',
    'Perfect World (Wanmei Shijie)',
    'A Will Eternal (Yi Nian Yong Heng)',
  ],
}: AdminVideoFormProps) {
  const { user, profile } = useAuth();
  const isEditMode = Boolean(initialVideo?.id);

  // Video Source Mode: 'upload' (Firebase Storage) or 'external' (AVCaption / External embed)
  const [sourceMode, setSourceMode] = useState<'upload' | 'external'>(
    initialVideo?.videoSource === 'external' ? 'external' : 'upload'
  );

  // File Upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [videoFilePreview, setVideoFilePreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadStageMessage, setUploadStageMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [seriesName, setSeriesName] = useState(
    initialVideo?.seriesName || initialVideo?.donghuaName || ''
  );
  const [title, setTitle] = useState(initialVideo?.title || '');
  const [episodeNumber, setEpisodeNumber] = useState<number>(initialVideo?.episodeNumber || 1);
  const [seasonNumber, setSeasonNumber] = useState<number>(initialVideo?.seasonNumber || 1);
  const [description, setDescription] = useState(initialVideo?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialVideo?.thumbnailUrl || DEFAULT_THUMBNAILS[0]
  );
  const [embedUrl, setEmbedUrl] = useState(
    initialVideo?.embedUrl || initialVideo?.avcaptionUrl || ''
  );
  const [videoUrl, setVideoUrl] = useState(
    initialVideo?.videoUrl || initialVideo?.videoStreamUrl || ''
  );
  const [videoType, setVideoType] = useState<ContentType>(
    (initialVideo?.videoType as ContentType) ||
      (initialVideo?.contentType as ContentType) ||
      'episode'
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

  const [adsAllowed, setAdsAllowed] = useState<boolean>(initialVideo?.adsAllowed !== false);
  const [downloadAllowed, setDownloadAllowed] = useState<boolean>(
    initialVideo?.downloadAllowed !== false
  );
  const [earlyAccess, setEarlyAccess] = useState<boolean>(
    Boolean(initialVideo?.isNewEpisode || (initialVideo as any)?.earlyAccess)
  );
  const [exclusive, setExclusive] = useState<boolean>(
    Boolean((initialVideo as any)?.exclusive || initialVideo?.accessType === 'exclusive')
  );

  // Status & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoFilePreview) URL.revokeObjectURL(videoFilePreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [videoFilePreview, thumbnailPreview]);

  // Handle Video File selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check mime type or extension
    const validExtensions = ['.mp4', '.webm', '.mkv', '.mov'];
    const isVideo =
      file.type.startsWith('video/') ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isVideo) {
      setErrorMessage('Please select a valid video file (.mp4, .webm, .mkv, .mov).');
      return;
    }

    setErrorMessage(null);
    setSelectedVideoFile(file);

    // Auto-generate title if empty
    if (!title && seriesName) {
      setTitle(`${seriesName.trim()} Episode ${episodeNumber}`);
    } else if (!title) {
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setTitle(cleanBaseName);
    }

    // Create temporary local preview for immediate verification
    if (videoFilePreview) URL.revokeObjectURL(videoFilePreview);
    const objectUrl = URL.createObjectURL(file);
    setVideoFilePreview(objectUrl);
  };

  // Handle Thumbnail File selection
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file for the thumbnail (.jpg, .png, .webp).');
      return;
    }

    setErrorMessage(null);
    setSelectedThumbnailFile(file);

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);
  };

  // Auto-fill title helper when series & episode change
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

    // Form field validation
    if (!seriesName.trim()) {
      setErrorMessage('Please enter the Series Name.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a Video Title.');
      return;
    }

    let finalVideoUrl = videoUrl.trim();
    let finalVideoStoragePath = initialVideo?.videoStoragePath;
    let finalThumbnailUrl = thumbnailUrl.trim();
    let finalThumbnailStoragePath = initialVideo?.thumbnailStoragePath;
    let finalFileName = initialVideo?.fileName;
    let finalFileSize = initialVideo?.fileSize;

    // Direct Upload Mode Validation
    if (sourceMode === 'upload') {
      if (!isEditMode && !selectedVideoFile) {
        setErrorMessage('Please select an actual video file (.mp4, .webm, .mkv, .mov) to upload.');
        return;
      }
      if (isEditMode && !selectedVideoFile && !finalVideoUrl) {
        setErrorMessage('This video record has no uploaded file. Please select a video file.');
        return;
      }
    } else {
      // External / AVCaption Mode Validation
      const targetExternalUrl = (embedUrl || videoUrl).trim();
      const validation = validateVideoUrl(targetExternalUrl);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Please enter a valid external video or embed URL.');
        return;
      }
      finalVideoUrl = targetExternalUrl;
    }

    setIsSubmitting(true);
    setUploadStage('preparing');
    setUploadStageMessage('Preparing upload pipeline...');

    try {
      // 1. If a new video file was selected, upload directly to Firebase Storage
      if (sourceMode === 'upload' && selectedVideoFile) {
        setUploadStage('uploading');
        setUploadStageMessage(
          `Uploading ${selectedVideoFile.name} (${formatBytes(selectedVideoFile.size)}) to Firebase Storage...`
        );

        const seriesSlug = slugifySeries(seriesName);
        const videoId = initialVideo?.id || `vid_${Date.now()}`;

        const uploadResult = await uploadVideoToStorage(
          selectedVideoFile,
          (prog) => {
            setUploadProgress(prog);
            if (prog.percentage < 100) {
              setUploadStageMessage(
                `Uploading: ${prog.percentage}% (${prog.formattedTransferred} of ${prog.formattedTotal})`
              );
            } else {
              setUploadStage('processing');
              setUploadStageMessage('Processing upload and acquiring permanent download URL...');
            }
          },
          {
            seriesSlug,
            videoId,
            adminEmail: user?.email || '',
            adminRole: profile?.role || 'admin',
          }
        );

        finalVideoUrl = uploadResult.downloadUrl;
        finalVideoStoragePath = uploadResult.storagePath;
        finalFileName = uploadResult.fileName;
        finalFileSize = uploadResult.fileSize;
      }

      // 2. If a new thumbnail file was selected, upload to Storage
      if (selectedThumbnailFile) {
        setUploadStageMessage('Uploading custom thumbnail image...');
        const thumbResult = await uploadThumbnailToStorage(selectedThumbnailFile, undefined, {
          adminEmail: user?.email || '',
          adminRole: profile?.role || 'admin',
        });
        finalThumbnailUrl = thumbResult.downloadUrl;
        finalThumbnailStoragePath = thumbResult.storagePath;
      }

      // 3. Save metadata to Firebase Realtime Database & Cloud Firestore
      setUploadStage('saving_metadata');
      setUploadStageMessage('Writing persistent record to Firebase Realtime Database...');

      const payload: Partial<VideoItem> & Record<string, any> = {
        id: initialVideo?.id,
        title: title.trim(),
        seriesName: seriesName.trim(),
        donghuaName: seriesName.trim(),
        seriesId: slugifySeries(seriesName),
        episodeNumber: Number(episodeNumber) || 1,
        seasonNumber: Number(seasonNumber) || 1,
        description: description.trim() || `${seriesName.trim()} - Episode ${episodeNumber}`,
        shortDescription: description.trim().slice(0, 150),
        thumbnailUrl: finalThumbnailUrl || DEFAULT_THUMBNAILS[0],
        posterUrl: finalThumbnailUrl || DEFAULT_THUMBNAILS[0],
        videoSource: sourceMode === 'external' ? 'external' : 'firebase',
        videoUrl: finalVideoUrl,
        embedUrl: sourceMode === 'external' ? embedUrl.trim() || finalVideoUrl : finalVideoUrl,
        avcaptionUrl: sourceMode === 'external' ? embedUrl.trim() || finalVideoUrl : finalVideoUrl,
        videoStreamUrl: finalVideoUrl,
        videoStoragePath: finalVideoStoragePath,
        thumbnailStoragePath: finalThumbnailStoragePath,
        fileName: finalFileName,
        fileSize: finalFileSize,
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
        adsAllowed,
        adsEnabled: adsAllowed,
        downloadAllowed,
        downloadEnabled: downloadAllowed,
        earlyAccess,
        isNewEpisode: earlyAccess,
        exclusive,
        exclusiveAccess: exclusive,
        uploadedBy: user?.email || 'admin',
      };

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
        throw new Error(data.error || 'Failed to save video metadata to Firebase.');
      }

      // Multi-layer client sync to Firebase RTDB and Firestore
      if (data.video) {
        if (rtdb) {
          try {
            await set(ref(rtdb, `videos/${data.video.id}`), data.video);
          } catch (rtdbErr) {
            console.warn('Direct client RTDB write notice:', rtdbErr);
          }
        }
        try {
          await setDoc(doc(db, 'videos', data.video.id), data.video, { merge: true });
        } catch (fsErr) {
          console.warn('Direct client Firestore write notice:', fsErr);
        }
      }

      setUploadStage('completed');
      setSuccessMessage(
        isEditMode
          ? `Video "${title}" was successfully updated in Firebase!`
          : `Video "${title}" was successfully uploaded and published to Realtime Database!`
      );

      if (!isEditMode) {
        // Reset file selections for subsequent uploads
        setSelectedVideoFile(null);
        setSelectedThumbnailFile(null);
        if (videoFilePreview) URL.revokeObjectURL(videoFilePreview);
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setVideoFilePreview(null);
        setThumbnailPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (thumbInputRef.current) thumbInputRef.current.value = '';

        // Auto increment episode number for seamless next episode additions
        setEpisodeNumber((prev) => prev + 1);
        setTitle(`${seriesName} Episode ${episodeNumber + 1}`);
      }

      if (onSuccess && data.video) {
        onSuccess(data.video);
      }
    } catch (err: any) {
      console.error('Video upload execution error:', err);
      setUploadStage('error');
      setErrorMessage(err.message || 'An error occurred during video upload.');
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
          storagePath: initialVideo.videoStoragePath,
          thumbnailPath: initialVideo.thumbnailStoragePath,
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

  // Preview URL to render in live preview
  const activePreviewUrl =
    videoFilePreview ||
    videoUrl ||
    embedUrl ||
    (initialVideo?.videoUrl || initialVideo?.embedUrl || '');

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
              {isEditMode ? 'Edit Video Details' : 'Upload Video to Decent Animation'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Persistent Storage
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Upload real MP4/video files directly to Firebase Storage and save metadata to Realtime Database.
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
        <div className="m-5 p-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">Upload / Validation Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="m-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-white">Upload Confirmed</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real-time Upload Progress Banner (When in progress) */}
      {isSubmitting && (
        <div className="m-5 p-5 rounded-2xl bg-gradient-to-r from-[#18182a] to-[#121220] border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="flex items-center gap-2 text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>{uploadStageMessage}</span>
            </span>
            {uploadProgress && (
              <span className="text-amber-400 font-bold">{uploadProgress.percentage}%</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-[#2b2b40]">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-200 ease-out"
              style={{
                width: `${
                  uploadStage === 'saving_metadata'
                    ? 95
                    : uploadStage === 'processing'
                    ? 90
                    : uploadProgress?.percentage || 5
                }%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>
              Stage:{' '}
              <strong className="text-gray-200 uppercase">
                {uploadStage.replace('_', ' ')}
              </strong>
            </span>
            {uploadProgress && (
              <span>
                {uploadProgress.formattedTransferred} of {uploadProgress.formattedTotal}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Preview Panel (When Enabled) */}
      {showLivePreview && (
        <div className="m-5 p-5 rounded-2xl bg-[#0c0c14] border border-amber-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-mono font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              LIVE VISITOR PREVIEW (Real Player + Metadata)
            </span>
            <span className="text-gray-400">
              {accessType === 'free' ? 'FREE TO WATCH' : `REQUIRES: ${requiredPlan.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Player Preview */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2b2b40] relative shadow-inner">
              {activePreviewUrl ? (
                sourceMode === 'external' &&
                (activePreviewUrl.includes('embed') || activePreviewUrl.includes('iframe')) ? (
                  <iframe
                    src={activePreviewUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title={title || 'Preview Player'}
                  />
                ) : (
                  <video
                    src={activePreviewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    poster={thumbnailPreview || thumbnailUrl}
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center space-y-2">
                  <Play className="w-8 h-8 text-amber-500/50" />
                  <p className="text-xs">Select a video file or enter a link to preview playback here.</p>
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
              <h3 className="text-base font-bold text-white leading-snug">
                {title || 'Video Title Goes Here'}
              </h3>
              <p className="text-xs text-amber-400 font-semibold font-mono">
                {seriesName || 'Series Name'}
              </p>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {description || 'Episode description summary as seen by cultivators.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* SECTION 1: VIDEO SOURCE MODE SELECTOR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Video Storage Source</span>
            </label>
            <span className="text-[10px] text-gray-400 font-mono">
              {sourceMode === 'upload' ? 'Direct Firebase Storage Upload' : 'External AVCaption Link'}
            </span>
          </div>

          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#141422] border border-[#28283c]">
            <button
              type="button"
              onClick={() => setSourceMode('upload')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                sourceMode === 'upload'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video File (Firebase Storage)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('external')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                sourceMode === 'external'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>External / AVCaption Link</span>
            </button>
          </div>

          {/* MODE 1: DIRECT VIDEO FILE UPLOAD */}
          {sourceMode === 'upload' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#161628] to-[#121220] border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-amber-400" />
                  Select Video File (.mp4, .webm, .mkv, .mov)
                </span>
                {selectedVideoFile && (
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    {formatBytes(selectedVideoFile.size)}
                  </span>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mkv,video/quicktime,video/*"
                onChange={handleVideoFileChange}
                className="hidden"
              />

              {/* Dropzone Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-3 ${
                  selectedVideoFile
                    ? 'bg-[#18182a] border-emerald-500/60 shadow-lg'
                    : 'bg-[#0d0d16] border-[#2e2e46] hover:border-amber-400/60 hover:bg-[#131320]'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    selectedVideoFile
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-[#1c1c2c] text-amber-400 border border-[#2b2b40]'
                  }`}
                >
                  <FileVideo className="w-7 h-7" />
                </div>

                {selectedVideoFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white break-all">
                      {selectedVideoFile.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      File Size: <strong className="text-emerald-400">{formatBytes(selectedVideoFile.size)}</strong> • Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-w-sm">
                    <p className="text-sm font-bold text-white">
                      Click to choose video file or drag and drop here
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports MP4, WebM, MKV, QuickTime. Uploads directly to Firebase Storage bucket.
                    </p>
                  </div>
                )}
              </div>

              {/* If editing an existing uploaded video and no new file selected yet */}
              {isEditMode && !selectedVideoFile && initialVideo?.videoUrl && (
                <div className="p-3 rounded-xl bg-[#141422] border border-[#262638] flex items-center justify-between text-xs">
                  <div className="space-y-0.5 truncate mr-2">
                    <span className="text-[10px] uppercase font-mono text-gray-400 block">
                      Currently Attached Video URL:
                    </span>
                    <p className="text-amber-300 font-mono truncate">{initialVideo.videoUrl}</p>
                    {initialVideo.fileSize && (
                      <span className="text-[10px] text-gray-500 font-mono">
                        Saved Size: {initialVideo.fileSize}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#222234] hover:bg-[#2b2b42] text-white font-semibold text-xs shrink-0"
                  >
                    Replace File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: EXTERNAL AVCAPTION LINK */}
          {sourceMode === 'external' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#161628] to-[#121220] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  AVCaption Embed / Video URL <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-gray-400 font-mono">External Host</span>
              </div>

              <input
                type="url"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="https://avcaption.com/embed/your-video-id"
                className="w-full px-4 py-3 rounded-xl bg-[#0b0b12] border border-[#2d2d44] text-white text-xs sm:text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Paste your AVCaption embed or external video stream link here. It will be preserved and played through the player.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 2: SERIES & EPISODE ORGANIZATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Series Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>
                Series Name <span className="text-red-400">*</span>
              </span>
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
              Season #
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
            <label className="text-[11px] font-bold text-gray-300 uppercase">Type</label>
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

        {/* SECTION 3: ACCESS & STREAMING PERMISSIONS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141422] border border-[#232338] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Access Model
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">100% Free Streaming Sanctuary</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs sm:text-sm text-emerald-200">Free to Watch For All Viewers</p>
              <p className="text-[11px] text-gray-300">All registered and guest cultivators have unrestricted playback access.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              FREE TIER
            </span>
          </div>

          {/* Feature Flags: Ads, Download, Early Access, Exclusive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#232338]">
            <label className="p-3 rounded-xl bg-[#0e0e18] border border-[#232338] flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-gray-300">Ads</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  adsAllowed
                    ? 'bg-amber-950 text-amber-300 border border-amber-600'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {adsAllowed ? 'ON' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={adsAllowed}
                onChange={(e) => setAdsAllowed(e.target.checked)}
                className="sr-only"
              />
            </label>

            <label className="p-3 rounded-xl bg-[#0e0e18] border border-[#232338] flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-gray-300">Download</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  downloadAllowed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {downloadAllowed ? 'ON' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={downloadAllowed}
                onChange={(e) => setDownloadAllowed(e.target.checked)}
                className="sr-only"
              />
            </label>

            <label className="p-3 rounded-xl bg-[#0e0e18] border border-[#232338] flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-gray-300">Early Access</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  earlyAccess
                    ? 'bg-purple-950 text-purple-300 border border-purple-600'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {earlyAccess ? 'ON' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={earlyAccess}
                onChange={(e) => setEarlyAccess(e.target.checked)}
                className="sr-only"
              />
            </label>

            <label className="p-3 rounded-xl bg-[#0e0e18] border border-[#232338] flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-gray-300">Exclusive</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  exclusive
                    ? 'bg-rose-950 text-rose-300 border border-rose-600'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {exclusive ? 'ON' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={exclusive}
                onChange={(e) => setExclusive(e.target.checked)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* SECTION 4: THUMBNAIL (FILE UPLOAD OR URL) */}
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#141422] border border-[#232338]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Video Thumbnail Poster</span>
            </label>
            <span className="text-[10px] text-gray-500 font-normal">File upload or URL</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Thumbnail Preview Thumbnail */}
            <div className="w-24 h-16 rounded-xl overflow-hidden bg-black border border-[#2b2b40] shrink-0 relative">
              <img
                src={thumbnailPreview || thumbnailUrl || DEFAULT_THUMBNAILS[0]}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Custom File Upload Button */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex gap-2">
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#1f1f32] hover:bg-[#282840] border border-[#32324c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Image File</span>
                </button>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => {
                    setThumbnailUrl(e.target.value);
                    if (thumbnailPreview) {
                      URL.revokeObjectURL(thumbnailPreview);
                      setThumbnailPreview(null);
                    }
                  }}
                  placeholder="Or paste image URL (https://...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0e0e18] border border-[#27273c] text-white text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Sample Presets */}
              <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                <span className="text-[10px] text-gray-500 shrink-0">Presets:</span>
                {DEFAULT_THUMBNAILS.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setThumbnailUrl(thumb);
                      if (thumbnailPreview) {
                        URL.revokeObjectURL(thumbnailPreview);
                        setThumbnailPreview(null);
                      }
                    }}
                    className={`w-10 h-6 rounded-md overflow-hidden border shrink-0 transition-transform ${
                      thumbnailUrl === thumb && !thumbnailPreview
                        ? 'ring-2 ring-amber-400 scale-105'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
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
              {isPublished
                ? 'Status: Published (Visible to Visitors)'
                : 'Status: Draft (Hidden from Visitors)'}
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
                  <Loader2 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {uploadProgress && uploadProgress.percentage < 100
                      ? `Uploading (${uploadProgress.percentage}%)...`
                      : 'Saving to Firebase...'}
                  </span>
                </>
              ) : isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Video</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Upload &amp; Publish Video</span>
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
              Are you sure you want to permanently remove <strong>"{title}"</strong> from the Firebase video catalogue?
            </p>
            {initialVideo?.videoStoragePath && (
              <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 font-mono">
                The uploaded video file stored at <code>{initialVideo.videoStoragePath}</code> will also be deleted from Firebase Storage.
              </p>
            )}
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
                {isDeleting ? 'Deleting...' : 'Yes, Delete Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
