'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { WatchHistoryItem } from './types';

interface UseWatchProgressProps {
  videoId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onInitialSeekReady?: (savedSeconds: number) => void;
}

export function useWatchProgress({
  videoId,
  videoRef,
  onInitialSeekReady,
}: UseWatchProgressProps) {
  const { user } = useAuth();
  const [initialProgress, setInitialProgress] = useState<WatchHistoryItem | null>(null);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch saved progress from Firestore/API
  useEffect(() => {
    if (!user || !videoId) return;

    let isMounted = true;

    fetch(`/api/watch-history?userId=${user.uid}&videoId=${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.progress) {
          setInitialProgress(data.progress);
        }
      })
      .catch((err) => console.warn('Could not fetch initial watch progress:', err));

    return () => {
      isMounted = false;
    };
  }, [user, videoId]);

  // 2. Function to save progress to backend
  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!user || !videoId || duration <= 0) return;

      // Don't spam saves if time hasn't moved more than 2 seconds
      if (Math.abs(currentTime - lastSavedTimeRef.current) < 2 && lastSavedTimeRef.current > 0) {
        return;
      }

      lastSavedTimeRef.current = currentTime;
      setSaveStatus('saving');

      // Local storage fallback for instant offline recovery
      try {
        localStorage.setItem(
          `decent_progress_${user.uid}_${videoId}`,
          JSON.stringify({ progress: currentTime, duration, updatedAt: new Date().toISOString() })
        );
      } catch (e) {
        // Ignored
      }

      try {
        await fetch('/api/watch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            videoId,
            progressSeconds: currentTime,
            durationSeconds: duration,
          }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.warn('Watch progress sync notice:', err);
        setSaveStatus('idle');
      }
    },
    [user, videoId]
  );

  // 3. Attach listeners to the HTML5 video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user) return;

    // Restore playback position on first load
    const handleLoadedMetadata = () => {
      if (!hasRestoredPosition && initialProgress && initialProgress.progress > 5) {
        // If not completed and within bounds
        if (!initialProgress.completed && initialProgress.progress < video.duration - 15) {
          video.currentTime = initialProgress.progress;
          setHasRestoredPosition(true);
          if (onInitialSeekReady) {
            onInitialSeekReady(initialProgress.progress);
          }
        }
      }
    };

    // Debounced time update
    const handleTimeUpdate = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(video.currentTime, video.duration);
      }, 5000); // sync every 5 seconds
    };

    const handlePause = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveProgress(video.currentTime, video.duration);
    };

    const handleEnded = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveProgress(video.duration, video.duration);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Save on tab close
    const handleBeforeUnload = () => {
      if (video.currentTime > 0) {
        const payload = JSON.stringify({
          userId: user.uid,
          videoId,
          progressSeconds: video.currentTime,
          durationSeconds: video.duration,
        });
        navigator.sendBeacon?.('/api/watch-history', new Blob([payload], { type: 'application/json' }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoRef, user, videoId, initialProgress, hasRestoredPosition, saveProgress, onInitialSeekReady]);

  return {
    initialProgress,
    saveStatus,
    saveProgress,
  };
}
