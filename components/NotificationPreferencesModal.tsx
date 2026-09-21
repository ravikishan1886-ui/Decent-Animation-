'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Sparkles, Clock, Check, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({ isOpen, onClose }: Props) {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!isOpen || !user) return;

    fetch(`/api/notifications/preferences?userId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.preferences) {
          setPreferences(data.preferences);
        }
      })
      .catch((err) => console.warn('Could not load preferences:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          preferences,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Preferences saved successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">Notification Preferences</h3>
              <p className="text-xs text-zinc-400">Manage email alerts &amp; release notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm">Loading preferences...</span>
            </div>
          ) : (
            <>
              {/* Subscription Emails */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">Subscription &amp; Receipts</div>
                    <div className="text-xs text-zinc-400">Transactional receipts and instant VIP activation alerts</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.subscriptionEmails}
                    onChange={() => handleToggle('subscriptionEmails')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Expiry Reminders */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">Expiry Warning Reminders</div>
                    <div className="text-xs text-zinc-400">Timely warnings 7, 3, and 1 day before pass expiration</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.expiryReminders}
                    onChange={() => handleToggle('expiryReminders')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* New Content / Episode Drops */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">New Episode Releases</div>
                    <div className="text-xs text-zinc-400">Notifications when new episodes or Donghua titles premiere</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.newContent}
                    onChange={() => handleToggle('newContent')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">Browser Push Notifications</div>
                    <div className="text-xs text-zinc-400">Instant on-screen alerts on desktop and mobile browsers</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={() => handleToggle('pushNotifications')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer & Feedback */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            {successMsg && (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>{successMsg}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default NotificationPreferencesModal;
