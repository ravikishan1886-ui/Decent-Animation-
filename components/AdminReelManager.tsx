'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReelItem } from '@/lib/types';
import { fetchReels, saveReelAdmin, deleteReelAdmin } from '@/lib/reel-service';
import { useAuth } from '@/lib/auth-context';
import {
  Film,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  Sparkles,
  X,
  RotateCcw,
  Tv,
  Check,
} from 'lucide-react';

export function AdminReelManager() {
  const { user, profile } = useAuth();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');
  const [filterAccess, setFilterAccess] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState<string>('');
  const [episodeId, setEpisodeId] = useState('');
  const [hashtags, setHashtags] = useState('#Donghua #Reels #Cultivation');
  const [accessType, setAccessType] = useState<'free' | 'vip'>('free');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Real Upload Progress States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbUploadProgress, setThumbUploadProgress] = useState(0);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<ReelItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const loadAllReels = async () => {
    setLoading(true);
    try {
      const data = await fetchReels('all');
      setReels(data);
    } catch (e) {
      console.error('Failed to load reels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReels();
  }, []);

  const openCreateModal = () => {
    setEditingReel(null);
    setTitle('');
    setDescription('');
    setSeriesName('Battle Through the Heavens');
    setEpisodeNumber('12');
    setEpisodeId('btth-three-year-agreement');
    setHashtags('#BTTH #XiaoYan #Cultivation #Donghua');
    setAccessType('free');
    setStatus('published');
    setVideoUrl('');
    setThumbnailUrl('');
    setVideoFile(null);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setThumbFile(null);
    setThumbUploadProgress(0);
    setThumbUploadError(null);
    setFormError(null);
    setFormSuccess(null);
    setShowFormModal(true);
  };

  const openEditModal = (reel: ReelItem) => {
    setEditingReel(reel);
    setTitle(reel.title || '');
    setDescription(reel.description || '');
    setSeriesName(reel.seriesName || '');
    setEpisodeNumber(reel.episodeNumber ? String(reel.episodeNumber) : '');
    setEpisodeId(reel.episodeId || '');
    setHashtags(Array.isArray(reel.hashtags) ? reel.hashtags.join(' ') : reel.hashtags || '');
    setAccessType(reel.accessType || 'free');
    setStatus(reel.status || 'published');
    setVideoUrl(reel.videoUrl || '');
    setThumbnailUrl(reel.thumbnailUrl || '');
    setVideoFile(null);
    setVideoUploadProgress(100);
    setVideoUploadError(null);
    setThumbFile(null);
    setThumbUploadProgress(100);
    setThumbUploadError(null);
    setFormError(null);
    setFormSuccess(null);
    setShowFormModal(true);
  };

  // Real XHR Upload Function for accurate percentage tracking
  const uploadFileWithProgress = (
    file: File,
    type: 'video' | 'thumbnail',
    onProgress: (p: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('adminEmail', user?.email || profile?.email || 'admin@decent.com');
      formData.append('adminRole', profile?.role || 'admin');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/upload-file');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.downloadUrl) {
              resolve(res.downloadUrl);
            } else {
              reject(new Error(res.error || 'Upload failed'));
            }
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`HTTP error ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  const handleSelectVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUploadError(null);
    setVideoUploading(true);
    setVideoUploadProgress(0);

    try {
      const url = await uploadFileWithProgress(file, 'video', setVideoUploadProgress);
      setVideoUrl(url);
      setVideoUploading(false);
    } catch (err: any) {
      setVideoUploadError(err.message || 'Video upload failed');
      setVideoUploading(false);
    }
  };

  const handleSelectThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbUploadError(null);
    setThumbUploading(true);
    setThumbUploadProgress(0);

    try {
      const url = await uploadFileWithProgress(file, 'thumbnail', setThumbUploadProgress);
      setThumbnailUrl(url);
      setThumbUploading(false);
    } catch (err: any) {
      setThumbUploadError(err.message || 'Thumbnail upload failed');
      setThumbUploading(false);
    }
  };

  const handleSubmitReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError('Reel title is required');
      return;
    }

    if (!videoUrl) {
      setFormError('Please upload a video file or provide a valid Video Stream URL');
      return;
    }

    setFormSubmitting(true);
    try {
      const reelPayload: Partial<ReelItem> = {
        id: editingReel?.id,
        title: title.trim(),
        description: description.trim(),
        seriesName: seriesName.trim(),
        episodeNumber: episodeNumber ? Number(episodeNumber) || episodeNumber : '',
        episodeId: episodeId.trim(),
        hashtags: hashtags
          .split(' ')
          .map((t) => t.trim())
          .filter(Boolean),
        accessType,
        status,
        videoUrl,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        creatorId: user?.uid || 'admin',
        creatorName: profile?.name || 'Decent Admin',
      };

      const saved = await saveReelAdmin(reelPayload, Boolean(editingReel));
      setFormSuccess(`Reel "${saved.title}" saved successfully!`);
      setTimeout(() => {
        setShowFormModal(false);
        loadAllReels();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save reel');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePublish = async (reel: ReelItem) => {
    const nextStatus = reel.status === 'published' ? 'draft' : 'published';
    try {
      await saveReelAdmin({ ...reel, status: nextStatus }, true);
      loadAllReels();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReelAdmin(deleteTarget.id);
      setDeleteTarget(null);
      loadAllReels();
    } catch (e: any) {
      alert(e.message || 'Failed to delete reel');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Reels
  const filteredReels = reels.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.seriesName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeries =
      filterSeries === 'all' || r.seriesName?.toLowerCase().includes(filterSeries.toLowerCase());

    const matchesAccess = filterAccess === 'all' || r.accessType === filterAccess;

    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesSeries && matchesAccess && matchesStatus;
  });

  const seriesOptions = Array.from(
    new Set(reels.map((r) => r.seriesName).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#120e17] via-[#1a1222] to-[#0d0d14] border border-[#2c223a] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-wide">
              Reels &amp; Short Video Command Center
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Publish 9:16 high-definition Donghua short reels, fight scenes, and trailers with real video uploads, VIP access locks, and view stats.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black" />
          Add New Reel
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0f0f18] border border-[#202032]">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search reels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181826] border border-[#28283d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        {/* Series Filter */}
        <select
          value={filterSeries}
          onChange={(e) => setFilterSeries(e.target.value)}
          className="bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/80"
        >
          <option value="all">All Series</option>
          {seriesOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Access Type Filter */}
        <select
          value={filterAccess}
          onChange={(e) => setFilterAccess(e.target.value)}
          className="bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/80"
        >
          <option value="all">All Access Types</option>
          <option value="free">Free Reels</option>
          <option value="vip">VIP Only Reels</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/80"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Reels Table / Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 space-y-2">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f0f18] border border-[#202032] space-y-3">
          <Film className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-300">No reels found</p>
          <p className="text-xs text-gray-500">
            Try adjusting search or filters, or click &quot;Add New Reel&quot; above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReels.map((reel) => (
            <div
              key={reel.id}
              className="p-4 rounded-2xl bg-[#0f0f18] border border-[#202032] hover:border-[#383852] transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex space-x-3">
                {/* 9:16 Thumbnail preview */}
                <div className="relative w-20 h-32 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-[#2e2e42]">
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Film className="w-6 h-6" />
                    </div>
                  )}
                  {reel.accessType === 'vip' ? (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-black bg-amber-500 text-black rounded uppercase">
                      VIP
                    </span>
                  ) : (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold bg-emerald-600 text-white rounded uppercase">
                      FREE
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                        reel.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {reel.status || 'published'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {reel.views || 0} views
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {reel.title}
                  </h3>

                  {reel.seriesName && (
                    <p className="text-[11px] text-amber-400/90 font-medium truncate">
                      {reel.seriesName}{' '}
                      {reel.episodeNumber ? `Ep ${reel.episodeNumber}` : ''}
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 line-clamp-2">
                    {reel.description || 'No description'}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-[#1a1a2a] flex items-center justify-between text-xs">
                <button
                  onClick={() => handleTogglePublish(reel)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    reel.status === 'published'
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {reel.status === 'published' ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Publish
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(reel)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#202032] transition-colors"
                    title="Edit Reel"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(reel)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT REEL MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f18] border border-[#28283d] rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#202032] pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                {editingReel ? 'Edit Donghua Reel' : 'Add New Donghua Reel'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#202032]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {formError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitReel} className="space-y-4 text-xs sm:text-sm">
              {/* REAL VIDEO UPLOAD SECTION */}
              <div className="p-4 rounded-xl bg-[#141420] border border-[#252538] space-y-3">
                <label className="font-bold text-white block">
                  1. Video File Upload (9:16 Vertical MP4 / WebM / MKV)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/mp4,video/webm,video/mkv,video/quicktime"
                    onChange={handleSelectVideoFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videoUploading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    Select Reel Video File
                  </button>

                  <span className="text-xs text-gray-400 truncate max-w-xs">
                    {videoFile ? videoFile.name : videoUrl ? 'File uploaded or Stream URL set' : 'No file chosen'}
                  </span>
                </div>

                {videoUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-amber-300 font-mono">
                      <span>Uploading video file to server...</span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#202032] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-600 to-amber-500 h-2 transition-all duration-150"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {videoUploadError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {videoUploadError}
                  </p>
                )}

                <div className="pt-1">
                  <label className="text-[11px] text-gray-400 block mb-1">
                    Or direct Video Stream URL:
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://.../video.mp4"
                    className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* REAL THUMBNAIL UPLOAD SECTION */}
              <div className="p-4 rounded-xl bg-[#141420] border border-[#252538] space-y-3">
                <label className="font-bold text-white block">
                  2. Thumbnail Image Upload (Optional JPG / PNG)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={thumbInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSelectThumbFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={thumbUploading}
                    className="px-4 py-2 rounded-xl bg-[#202032] hover:bg-[#2a2a40] text-gray-200 font-semibold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Select Thumbnail
                  </button>

                  <span className="text-xs text-gray-400 truncate max-w-xs">
                    {thumbFile ? thumbFile.name : thumbnailUrl ? 'Thumbnail URL set' : 'No thumbnail chosen'}
                  </span>
                </div>

                {thumbUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-amber-300 font-mono">
                      <span>Uploading thumbnail...</span>
                      <span>{thumbUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#202032] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 transition-all duration-150"
                        style={{ width: `${thumbUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reel Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Reel Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Xiao Yan's Angry Buddha Lotus Transformation!"
                    className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Description / Caption
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief highlight description for this short reel..."
                    className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 h-20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Series Name
                    </label>
                    <input
                      type="text"
                      value={seriesName}
                      onChange={(e) => setSeriesName(e.target.value)}
                      placeholder="e.g. Battle Through the Heavens"
                      className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Episode Number
                    </label>
                    <input
                      type="text"
                      value={episodeNumber}
                      onChange={(e) => setEpisodeNumber(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Hashtags (space separated)
                  </label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#BTTH #XiaoYan #Donghua"
                    className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Access Type
                    </label>
                    <select
                      value="free"
                      disabled
                      className="w-full bg-[#141420] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none"
                    >
                      <option value="free">100% Free For All Cultivators</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Publish Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                      className="w-full bg-[#181826] border border-[#28283d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#202032] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202032] hover:bg-[#2e2e42] text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting || videoUploading || thumbUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] disabled:opacity-40 flex items-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingReel ? 'Update Reel' : 'Publish Reel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f18] border border-red-900/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                Confirm Permanent Reel Deletion
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete &quot;
              <strong className="text-white">{deleteTarget.title}</strong>&quot;? This action cannot be undone.
            </p>
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#202032] hover:bg-[#2e2e42] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(201,42,42,0.4)] flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Reel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
