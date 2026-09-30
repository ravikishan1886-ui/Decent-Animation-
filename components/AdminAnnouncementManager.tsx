'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AnnouncementItem } from '@/lib/types';
import { Megaphone, PlusCircle, Trash2, CheckCircle2, RefreshCw, X, Radio } from 'lucide-react';

export function AdminAnnouncementManager() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [type, setType] = useState<string>('release');
  const [link, setLink] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.warn('Announcements fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          title: title.trim(),
          content: content.trim(),
          type,
          link: link.trim(),
          adminEmail: user.email,
        }),
      });

      if (res.ok) {
        setToast('Announcement broadcasted and notification dispatched!');
        setTimeout(() => setToast(null), 3500);
        setShowModal(false);
        setTitle('');
        setContent('');
        setLink('');
        fetchAnnouncements();
      }
    } catch (e) {
      console.warn('Create announcement error:', e);
    }
  };

  const handleAction = async (action: string, id: string) => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, announcementId: id, adminEmail: user.email }),
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (e) {
      console.warn('Announcement action error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            Announcement &amp; Broadcast Center
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Post top ticker banners and push notification alerts to all cultivators.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="p-4 rounded-2xl bg-[#12121a] border border-[#242436] flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.active
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {a.active ? 'ACTIVE BANNER' : 'ARCHIVED'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono uppercase">
                  {a.type}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{a.title}</h4>
              <p className="text-xs text-gray-300">{a.content}</p>
              {a.link && (
                <a
                  href={a.link}
                  className="text-[11px] text-amber-400 hover:underline inline-block font-mono"
                >
                  Target: {a.link}
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAction('TOGGLE', a.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181826] text-gray-300 hover:text-white border border-[#2c2c3e]"
              >
                {a.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleAction('DELETE', a.id)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
              <h4 className="text-base font-bold text-white">Broadcast Announcement</h4>
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
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Perfect World Episode 165 Hindi Dub is Live!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Broadcast Content / Message *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Shi Hao unlocks supreme heavenly lightning tribulation..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                  >
                    <option value="release">Episode Release</option>
                    <option value="maintenance">Platform Notice</option>
                    <option value="event">Cultivator Event</option>
                    <option value="general">General Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="/watch/perfect-world-ep165"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#181824] border border-[#2b2b3d] text-xs text-white"
                  />
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
                Send Broadcast
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
