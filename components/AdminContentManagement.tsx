'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VideoItem, AccessType, PublishingStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AdminVideoForm } from './AdminVideoForm';
import {
  Video,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Tv,
  Film,
  Sparkles,
  Clapperboard,
  RefreshCw,
  ExternalLink,
  Play,
  Layers,
} from 'lucide-react';

interface AdminContentManagementProps {
  onOpenUpload?: () => void;
  onEditVideo?: (video: VideoItem) => void;
}

export function AdminContentManagement({ onOpenUpload, onEditVideo }: AdminContentManagementProps) {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // all, free, subscription, premium, vip, published, draft
  const [selectedType, setSelectedType] = useState<string>('all');

  // Video Form Modal state (for Add & Edit)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isAddingVideo, setIsAddingVideo] = useState<boolean>(false);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<VideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchVideos = (customSearch?: string) => {
    setLoading(true);
    let url = `/api/admin/videos?filter=${activeFilter}`;
    const query = customSearch !== undefined ? customSearch : searchQuery;
    if (query.trim()) url += `&search=${encodeURIComponent(query.trim())}`;
    if (selectedType !== 'all') url += `&contentType=${selectedType}`;

    fetch(url, {
      headers: {
        'x-admin-email': user?.email || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.videos) {
          setVideos(data.videos);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch videos:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    let url = `/api/admin/videos?filter=${activeFilter}`;
    if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    if (selectedType !== 'all') url += `&contentType=${selectedType}`;

    fetch(url, {
      headers: {
        'x-admin-email': user?.email || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.videos) {
            setVideos(data.videos);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch videos:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter, selectedType, searchQuery, user?.email]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleTogglePublish = async (video: VideoItem) => {
    const newStatus: PublishingStatus = video.published ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || '',
        },
        body: JSON.stringify({
          adminEmail: user?.email,
          adminRole: profile?.role || 'admin',
          videoId: video.id,
          updates: {
            published: !video.published,
            status: newStatus,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos(
          videos.map((v) => (v.id === video.id ? { ...v, published: !video.published, status: newStatus } : v))
        );
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmVideo) return;
    setIsDeleting(true);
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
          videoId: deleteConfirmVideo.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos(videos.filter((v) => v.id !== deleteConfirmVideo.id));
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmVideo(null);
    }
  };

  // Distinct series for autocomplete/filtering
  const existingSeries = Array.from(
    new Set(videos.map((v) => v.seriesName || v.donghuaName).filter(Boolean) as string[])
  );

  const filterTabs = [
    { id: 'all', label: 'All Content' },
    { id: 'free', label: 'Free' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'premium', label: 'Premium' },
    { id: 'vip', label: 'VIP' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f0f18] border border-[#202032]">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, series, or episode number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        {/* Filter and Upload Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Formats</option>
            <option value="episode">Episodes</option>
            <option value="movie">Movies</option>
            <option value="special">Specials</option>
          </select>

          <button
            onClick={() => fetchVideos()}
            className="p-2 rounded-xl bg-[#141420] hover:bg-[#1a1a28] text-gray-300 hover:text-white border border-[#262638] transition-colors"
            title="Refresh Library from Firebase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddingVideo(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add AVCaption Video</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 no-scrollbar border-b border-[#1b1b28]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#141422]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Videos List Table */}
      <div className="rounded-2xl bg-[#0f0f18] border border-[#202032] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#141422] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#202032]">
              <tr>
                <th className="py-3 px-3">Video / Series</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Episode</th>
                <th className="py-3 px-3">Access Tier</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181826]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading videos from Firebase Realtime Database...</span>
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <p className="text-sm font-semibold text-gray-400">No videos found matching your filter</p>
                    <p className="text-xs text-gray-600 mt-1">Click "Add AVCaption Video" to add your first episode.</p>
                  </td>
                </tr>
              ) : (
                videos.map((vid) => {
                  const isPublished = vid.published !== false && vid.status !== 'draft';
                  const hasEmbed = Boolean(vid.embedUrl || vid.avcaptionUrl);

                  return (
                    <tr key={vid.id} className="hover:bg-[#141422]/60 transition-colors">
                      {/* Video / Series */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="w-16 h-10 rounded-lg object-cover bg-[#161622] shrink-0 border border-[#2b2b3d]"
                          />
                          <div className="max-w-xs space-y-0.5">
                            <p className="font-bold text-white text-xs truncate">{vid.title}</p>
                            <p className="text-[11px] text-amber-400 font-mono truncate">
                              {vid.seriesName || vid.donghuaName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 capitalize">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {vid.contentType || vid.videoType || 'Episode'}
                        </span>
                      </td>

                      {/* Episode & Season */}
                      <td className="py-3 px-3 font-mono text-gray-300 font-bold">
                        E{vid.episodeNumber || 1} <span className="text-gray-500 font-normal">S{vid.seasonNumber || 1}</span>
                      </td>

                      {/* Access Tier */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                            vid.accessType === 'free'
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                              : vid.accessType === 'vip'
                              ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                              : vid.accessType === 'exclusive'
                              ? 'bg-purple-950/60 text-purple-400 border-purple-800/40'
                              : 'bg-blue-950/60 text-blue-400 border-blue-800/40'
                          }`}
                        >
                          {vid.accessType}
                        </span>
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-mono font-bold">
                          {hasEmbed ? 'AVCaption' : 'Internal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                            isPublished ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPublished ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                        {vid.createdAt ? vid.createdAt.split('T')[0] : 'Recent'}
                      </td>

                      {/* Actions: Edit, Publish/Unpublish, Delete, Preview */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Video Button */}
                          <button
                            onClick={() => setEditingVideo(vid)}
                            className="p-1.5 rounded-lg bg-[#1a1a28] hover:bg-[#252538] text-amber-300 hover:text-amber-200 transition-colors"
                            title="Edit Video Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview in Player Button */}
                          <Link
                            href={`/watch/${vid.id}`}
                            className="p-1.5 rounded-lg bg-[#1a1a28] hover:bg-[#252538] text-gray-300 hover:text-white transition-colors"
                            title="Preview in Player"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Toggle Publish / Unpublish */}
                          <button
                            onClick={() => handleTogglePublish(vid)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPublished
                                ? 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/60'
                                : 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60'
                            }`}
                            title={isPublished ? 'Unpublish to Draft' : 'Publish to Live'}
                          >
                            {isPublished ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Video Button */}
                          <button
                            onClick={() => setDeleteConfirmVideo(vid)}
                            className="p-1.5 rounded-lg bg-red-950/50 text-red-300 hover:bg-red-900/60 transition-colors"
                            title="Delete Video from Database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Video Modal */}
      {(isAddingVideo || editingVideo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto my-auto rounded-3xl">
            <AdminVideoForm
              initialVideo={editingVideo}
              existingSeriesList={existingSeries}
              onCancel={() => {
                setIsAddingVideo(false);
                setEditingVideo(null);
              }}
              onSuccess={(savedVideo) => {
                setIsAddingVideo(false);
                setEditingVideo(null);
                fetchVideos();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#12121e] border border-red-500/50 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Confirm Video Deletion
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to remove <strong>"{deleteConfirmVideo.title}"</strong> from the Firebase Realtime Database?
            </p>
            <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 font-mono">
              Note: Deleting this metadata will remove the episode from the website, but will <strong>NOT</strong> delete the video on AVCaption.com.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmVideo(null)}
                className="px-4 py-2 rounded-xl bg-[#1a1a2c] hover:bg-[#25253e] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
