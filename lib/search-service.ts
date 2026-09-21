/**
 * Decent Animation - Search & Filtering Engine
 * Supports multi-field token matching, genre/access/language faceted filtering, and sorting
 */

import { INITIAL_SEED_VIDEOS } from './seed-data';
import { VideoItem, SearchFilterParams, SearchResult, DONGHUA_GENRES, DONGHUA_ACCESS_TYPES } from './types';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Normalizes text for consistent token search
 */
export function normalizeSearchTerm(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * Fetch all available catalog videos (merging Firestore runtime videos + initial seed catalog)
 */
export async function getAllCatalogVideos(): Promise<VideoItem[]> {
  const videoMap = new Map<string, VideoItem>();

  // Add initial seed videos
  for (const v of INITIAL_SEED_VIDEOS) {
    videoMap.set(v.id, v);
  }

  // Fetch dynamic videos from Firestore
  try {
    const vSnap = await getDocs(collection(db, 'videos'));
    vSnap.forEach((d) => {
      const v = { id: d.id, ...d.data() } as VideoItem;
      if (v.published !== false) {
        videoMap.set(v.id, v);
      }
    });
  } catch (err) {
    console.warn('Firestore video catalog read notice (using catalog cache):', err);
  }

  return Array.from(videoMap.values());
}

/**
 * Core Search & Filter Execution
 */
export async function queryDonghuaVideos(params: SearchFilterParams): Promise<SearchResult> {
  const allVideos = await getAllCatalogVideos();
  const {
    q = '',
    genre = 'All',
    accessType = 'All',
    language = 'All',
    sort = 'newest',
    page = 1,
    limit = 12,
  } = params;

  const cleanQuery = normalizeSearchTerm(q);
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  let filtered = allVideos.filter((video) => {
    // 1. Text Search across Title, Donghua Name, Description, Tags, Category
    if (queryTokens.length > 0) {
      const searchableBlob = normalizeSearchTerm(
        `${video.title} ${video.donghuaName} ${video.description} ${(video.tags || []).join(' ')} ${video.category} ${video.genre}`
      );

      const matchesAllTokens = queryTokens.every((token) => searchableBlob.includes(token));
      if (!matchesAllTokens) return false;
    }

    // 2. Genre Filter
    if (genre && genre !== 'All' && genre !== 'all') {
      const normalizedGenre = genre.toLowerCase();
      const matchPrimary = (video.genre || '').toLowerCase() === normalizedGenre;
      const matchCategory = (video.category || '').toLowerCase() === normalizedGenre;
      const matchArray = (video.genres || []).some((g) => g.toLowerCase() === normalizedGenre);
      const matchTags = (video.tags || []).some((t) => t.toLowerCase() === normalizedGenre);

      if (!matchPrimary && !matchCategory && !matchArray && !matchTags) {
        return false;
      }
    }

    // 3. Access Type Filter
    if (accessType && accessType !== 'All' && accessType !== 'all') {
      const normAccess = accessType.toLowerCase();
      const videoAccess = (video.accessType || 'free').toLowerCase();

      if (normAccess === 'free' && videoAccess !== 'free') return false;
      if (normAccess === 'premium' && videoAccess !== 'subscription' && videoAccess !== 'premium') return false;
      if (normAccess === 'exclusive' && videoAccess !== 'exclusive') return false;
      if (normAccess === 'vip' && videoAccess !== 'vip') return false;
      if (normAccess === 'subscription' && videoAccess !== 'subscription' && videoAccess !== 'premium') return false;
    }

    // 4. Language Filter
    if (language && language !== 'All' && language !== 'all') {
      const normLang = language.toLowerCase();
      const videoLang = (video.language || '').toLowerCase();
      const videoAudio = (video.audio || '').toLowerCase();
      const videoSubs = (video.subtitles || '').toLowerCase();

      if (normLang.includes('hindi') && !videoLang.includes('hindi') && !videoAudio.includes('hindi') && !videoSubs.includes('hindi')) {
        return false;
      }
      if (normLang.includes('chinese') && !videoLang.includes('chinese') && !videoAudio.includes('chinese')) {
        return false;
      }
      if (normLang.includes('english') && !videoLang.includes('english') && !videoSubs.includes('english')) {
        return false;
      }
    }

    return true;
  });

  // 5. Sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case 'popular':
        return (b.views || 0) + (b.likes || 0) * 2 - ((a.views || 0) + (a.likes || 0) * 2);
      case 'updated':
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      case 'title_asc':
        return (a.donghuaName || a.title).localeCompare(b.donghuaName || b.title);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // 6. Pagination calculation
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    videos: paginated,
    total,
    page: currentPage,
    totalPages,
    genres: Array.from(DONGHUA_GENRES),
    accessTypes: Array.from(DONGHUA_ACCESS_TYPES),
    hasMore: currentPage < totalPages,
  };
}
