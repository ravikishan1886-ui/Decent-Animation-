'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LiveStreamItem } from '@/lib/types';
import { Radio, PlusCircle, Trash2, CheckCircle2, Play, Square, Users, X } from 'lucide-react';

export function AdminLiveManager() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStreamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hlsStreamUrl, setHlsStreamUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [accessTier, setAccessTier] = useState<string>('free');
  const [toast, setToast] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/live');
      if (res.ok) {
        const data = await res.json();
        setStreams(data.streams || []);
      }
    } catch (e) {
      console.warn('Live fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      const res = await fetch('/api/admin/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          title: title.trim(),
          description: description.trim(),
          hlsStreamUrl: hlsStreamUrl.trim() || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          thumbnailUrl:
            thumbnailUrl.trim() ||
            'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
          accessTier,
          adminEmail: user.email,
        }),
      });

      if (res.ok) {
        setToast('Live Stream created & ready to broadcast!');
        setTimeout(() => setToast(null), 3500);
        setShowModal(false);
        setTitle('');
        setDescription('');
        setHlsStreamUrl('');
        setThumbnailUrl('');
        fetchStreams();
      }
    } catch (e) {
      console.warn('Create live error:', e);
    }
  };

  const handleAction = async (action: string, streamId: string) => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/admin/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, streamId, adminEmail: user.email }),
      });
      if (res.ok) {
        fetchStreams();
      }
    } catch (e) {
      console.warn('Live stream action error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            Live Streaming Broadcast Console
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Stream premier watch-alongs, Hindi Dub marathons, and community Q&amp;As with live Super Chat.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Stream</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Streams list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {streams.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-[#12121a] border border-[#242436] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  s.status === 'live'
                    ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                    : s.status === 'scheduled'
                    ? 'bg-blue-950 text-blue-300 border border-blue-700'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {s.status}
              </span>

              <div className="flex items-center gap-1.5">
                {s.status === 'live' ? (
                  <button
                    onClick={() => handleAction('END', s.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-950/40 text-xs flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" /> End
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('START', s.id)}
                    className="p-1 rounded text-emerald-400 hover:bg-emerald-950/40 text-xs flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Go Live
                  </button>
                )}
                <button
                  onClick={() => handleAction('DELETE', s.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white">{s.title}</h4>
            <p className="text-xs text-gray-400 line-clamp-2">{s.description}</p>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#1e1e2e]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> {s.viewerCount || 0} watching
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                ₹{s.superChatTotal || 0} Super Chat
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl bg-[#14141e] border border-[#2c2c3e] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">Create Broadcast Stream</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Stream Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Battle Through the Heavens Season 5 Special Watch-Along"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  HLS / Video URL (M3U8 / MP4)
                </label>
                <input
                  type="url"
                  placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                  value={hlsStreamUrl}
                  onChange={(e) => setHlsStreamUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Access Requirement
                  </label>
                  <select
                    value={accessTier}
                    onChange={(e) => setAccessTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                  >
                    <option value="free">Free for all Cultivators</option>
                    <option value="premium">Premium Only</option>
                    <option value="vip">VIP Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
              >
                Initialize Stream
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
