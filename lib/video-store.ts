import fs from 'fs';
import path from 'path';
import { VideoItem } from './types';

function getDataDir(): string {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn('Could not create data directory:', e);
    }
  }
  return dir;
}

function getVideosFilePath(): string {
  return path.join(getDataDir(), 'videos.json');
}

/**
 * Loads all custom uploaded videos from local persistent JSON store.
 */
export function loadServerVideos(): VideoItem[] {
  try {
    const filePath = getVideosFilePath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading server videos file:', err);
    return [];
  }
}

/**
 * Saves a new video or replaces an existing video in local persistent JSON store.
 */
export async function saveServerVideo(video: VideoItem): Promise<boolean> {
  try {
    const filePath = getVideosFilePath();
    const current = loadServerVideos();
    const index = current.findIndex((v) => v.id === video.id);

    if (index >= 0) {
      current[index] = { ...current[index], ...video, updatedAt: new Date().toISOString() };
    } else {
      current.unshift(video);
    }

    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing server video file:', err);
    return false;
  }
}

/**
 * Updates an existing video in local persistent JSON store.
 */
export async function updateServerVideo(
  id: string,
  updates: Partial<VideoItem>
): Promise<VideoItem | null> {
  try {
    const filePath = getVideosFilePath();
    const current = loadServerVideos();
    const index = current.findIndex((v) => v.id === id);

    if (index < 0) return null;

    current[index] = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
    return current[index];
  } catch (err) {
    console.error('Error updating server video file:', err);
    return null;
  }
}

/**
 * Deletes a video from local persistent JSON store.
 */
export async function deleteServerVideo(id: string): Promise<boolean> {
  try {
    const filePath = getVideosFilePath();
    const current = loadServerVideos();
    const filtered = current.filter((v) => v.id !== id);

    if (filtered.length === current.length) return false;

    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error deleting server video file:', err);
    return false;
  }
}
