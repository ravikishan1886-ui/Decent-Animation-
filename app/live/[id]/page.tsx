'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LiveStreamItem, LiveChatMessage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Radio,
  Users,
  Heart,
  Send,
  Lock,
  Crown,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Share2,
} from 'lucide-react';

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const liveId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  const { user, profile, isAdmin } = useAuth();

  const [stream, setStream] = useState<LiveStreamItem | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const fetchStreamInfo = useCallback(async () => {
    if (!liveId) return;
    try {
      const res = await fetch(`/api/live`);
      if (res.ok) {
        const data = await res.json();
        const found = (data.streams || []).find((s: LiveStreamItem) => s.id === liveId || s.liveId === liveId);
        if (found) setStream(found);
      }
    } catch (e) {
      console.warn('Stream info fetch notice:', e);
    } finally {
      setLoading(false);
    }
  }, [liveId]);

  const fetchChatMessages = useCallback(async () => {
    if (!liveId) return;
    try {
      const res = await fetch(`/api/live/${liveId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.warn('Chat fetch error:', e);
    }
  }, [liveId]);

  useEffect(() => {
    fetchStreamInfo();
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchStreamInfo, fetchChatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setChatError('Please log in to chat.');
      return;
    }
    if (!inputText.trim()) return;

    try {
      const res = await fetch(`/api/live/${liveId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          username: profile?.name || user.displayName || user.email?.split('@')[0] || 'Cultivator',
          content: inputText.trim(),
          badge: isAdmin ? 'Admin' : 'Cultivator',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post message');
      }

      setInputText('');
      setChatError(null);
      fetchChatMessages();
    } catch (err: any) {
      setChatError(err.message || 'Chat error');
    }
  };

  const hasAccess = true;

  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col selection:bg-red-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Stream and Live Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Video Broadcast Stage */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232334] shadow-2xl">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-mono">Tuning to Heavenly Frequency...</p>
                </div>
              ) : !hasAccess ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
                  <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-600/50 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(201,42,42,0.8)]">
                    <Lock className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Exclusive Live Broadcast</h3>
                  <p className="text-xs text-gray-400 max-w-sm mb-4">
                    This live stream is restricted to {stream?.accessTier?.toUpperCase()} subscribers.
                  </p>
                  <button
                    onClick={() => router.push(`/subscription?plan=${stream?.accessTier}`)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 flex items-center gap-2 shadow-lg"
                  >
                    <Crown className="w-4 h-4" />
                    Unlock Live Access
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={stream?.hlsStreamUrl || stream?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    poster={stream?.thumbnailUrl}
                  >
                    Your browser does not support live video player.
                  </video>

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      LIVE STREAM
                    </span>
                    <span className="px-2 py-1 rounded bg-black/80 backdrop-blur-sm text-gray-200 text-xs font-mono flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-red-400" />
                      {stream?.viewerCount || 1} watching
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Broadcast Details & Action */}
            <div className="p-6 rounded-3xl bg-[#12121a] border border-[#242436] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {stream?.title || 'Decent Animation Live Stream'}
                </h1>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                  {stream?.description || 'Live Chinese anime Hindi dub discussion and watch party.'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedToast(true);
                      setTimeout(() => setCopiedToast(false), 2500);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 shadow-[0_0_20px_rgba(201,42,42,0.4)] flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedToast ? 'Link Copied!' : 'Share Stream'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Live Chat Sidebar */}
          <div className="rounded-3xl bg-[#12121a] border border-[#242436] flex flex-col h-[600px] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-4 bg-[#181826] border-b border-[#242438] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Stream Chat
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Connected
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-500 space-y-1">
                  <p>Welcome to the stream chat!</p>
                  <p className="text-[11px]">Say hi to fellow cultivators.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isSuper = m.isSuperChat;
                  return (
                    <div
                      key={m.id}
                      className={`text-xs space-y-1 p-2 rounded-xl transition-all ${
                        isSuper
                          ? 'bg-gradient-to-r from-amber-950/60 to-red-950/60 border border-amber-500/50 shadow-md'
                          : 'hover:bg-[#181826]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white">@{m.username}</span>
                          {m.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#222234] text-amber-300">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="leading-relaxed text-gray-300">
                        {m.content}
                      </p>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#161622] border-t border-[#242436] space-y-2">
              {chatError && (
                <p className="text-[10px] text-red-400 font-mono">{chatError}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={user ? "Chat with cultivators..." : "Log in to chat"}
                  disabled={!user}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#12121c] border border-[#2c2c3e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!user || !inputText.trim()}
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
