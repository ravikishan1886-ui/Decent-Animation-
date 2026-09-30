'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationItem } from '@/lib/types';
import { Bell, Check, Trash2, Megaphone, Crown, MessageSquare, ExternalLink, X } from 'lucide-react';

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      }
    } catch (e) {
      console.warn('Notification fetch notice:', e);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        ignore = true;
        clearInterval(interval);
      };
    }
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ', userId: user.uid }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Mark all read error:', e);
    }
  };

  const markSingleRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.warn('Mark single read error:', e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#161622] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#12121c] border border-[#2b2b3d] shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 bg-[#171724] border-b border-[#242436] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-600/30 text-red-300 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-amber-400 hover:underline font-semibold"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1e1e2c]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="font-semibold text-gray-300">No Notifications Yet</p>
                <p className="text-[11px] text-gray-500">
                  You'll be alerted when new episodes, polls, or live streams arrive.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isAnnouncement = n.type === 'announcement' || n.type === 'system';
                const isSub = n.type === 'subscription';

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markSingleRead(n.id)}
                    className={`p-3.5 text-xs space-y-1 transition-colors hover:bg-[#181826] cursor-pointer ${
                      !n.read ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {isAnnouncement ? (
                          <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : isSub ? (
                          <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[220px]">{n.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline pt-0.5"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
