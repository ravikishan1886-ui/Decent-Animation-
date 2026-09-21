'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VideoItem, AccessType, PublishingStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
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
} from 'lucide-react';

interface AdminContentManagementProps {
  onOpenUpload: () => void;
  onEditVideo?: (video: VideoItem) => void;
}

export function AdminContentManagement({ onOpenUpload, onEditVideo }: AdminContentManagementProps) {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // all, free, subscription, premium, vip, published, draft
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchVideos = (customSearch?: string) => {
    setLoading(true);
    let url = `/api/admin/videos?filter=${activeFilter}`;
    const query = customSearch !== undefined ? customSearch : searchQuery;
    if (query.trim()) url += `&search=${encodeURIComponent(query.trim())}`;
    if (selectedType !== 'all') url += `&contentType=${selectedType}`;

    fetch(url)
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

    fetch(url)
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
  }, [activeFilter, selectedType, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleTogglePublish = async (video: VideoItem) => {
    const newStatus: PublishingStatus = video.published ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  const handleDelete = async (videoId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the catalogue?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          adminRole: profile?.role || 'admin',
          videoId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos(videos.filter((v) => v.id !== videoId));
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

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
            placeholder="Search by title, series, or genre..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        {/* Filter and Upload Button */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141420] border border-[#262638] text-white text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Formats</option>
            <option value="series">Donghua Series</option>
            <option value="episode">Episodes</option>
            <option value="movie">Movies</option>
            <option value="special">Specials</option>
          </select>

          <button
            onClick={() => fetchVideos()}
            className="p-2 rounded-xl bg-[#141420] hover:bg-[#1a1a28] text-gray-300 hover:text-white border border-[#262638]"
            title="Refresh Library"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Content</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 no-scrollbar border-b border-[#1b1b28]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-red-950/70 text-amber-300 border border-red-600/50 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#141420]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Querying catalogue...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f0f18] border border-[#202032] text-center space-y-3">
          <Tv className="w-10 h-10 text-gray-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No content found</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            No Donghua episodes match the current filter. Click &ldquo;Upload New Content&rdquo; to add a new title.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Upload New Donghua
          </button>
        </div>
      ) : (
        <div className="p-2 sm:p-4 rounded-2xl bg-[#0f0f18] border border-[#202032] overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs text-gray-300 min-w-[700px]">
            <thead className="border-b border-[#202032] text-[11px] uppercase tracking-wider text-gray-400">
              <tr>
                <th className="py-3 px-3">Thumbnail</th>
                <th className="py-3 px-3">Title &amp; Series</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">EP / Season</th>
                <th className="py-3 px-3">Access</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Views</th>
                <th className="py-3 px-3">Upload Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181826]">
              {videos.map((vid) => {
                const isPublished = vid.published && vid.status !== 'draft';
                return (
                  <tr key={vid.id} className="hover:bg-[#141420] transition-colors">
                    {/* Thumbnail */}
                    <td className="py-3 px-3">
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-16 h-10 object-cover rounded-lg border border-[#262638]"
                      />
                    </td>

                    {/* Title & Series */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="font-bold text-white truncate">{vid.title}</p>
                      <p className="text-[11px] text-amber-400/90 font-mono truncate">{vid.donghuaName}</p>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 capitalize">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {vid.contentType || 'Episode'}
                      </span>
                    </td>

                    {/* Episode & Season */}
                    <td className="py-3 px-3 font-mono text-gray-300">
                      S{vid.seasonNumber || 1} • E{vid.episodeNumber || 1}
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

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
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

                    {/* Views */}
                    <td className="py-3 px-3 font-mono text-gray-300">
                      {(vid.views || 0) > 1000 ? `${((vid.views || 0) / 1000).toFixed(1)}k` : vid.views || 0}
                    </td>

                    {/* Upload Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                      {vid.createdAt ? vid.createdAt.split('T')[0] : 'Recent'}
                    </td>

                    {/* Actions: Edit, Publish/Unpublish, Delete, Preview */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/watch/${vid.id}`}
                          className="p-1.5 rounded-lg bg-[#1a1a28] hover:bg-[#252538] text-gray-300 hover:text-white transition-colors"
                          title="Preview in Player"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

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

                        <button
                          onClick={() => handleDelete(vid.id, vid.title)}
                          className="p-1.5 rounded-lg bg-red-950/50 text-red-300 hover:bg-red-900/60 transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
