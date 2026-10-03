import fs from 'fs';
import path from 'path';
import { ReelItem, ReelCommentItem } from './types';

function getDataDir(): string {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
  return dir;
}

function getReelsFilePath(): string {
  return path.join(getDataDir(), 'reels.json');
}

function getCommentsFilePath(): string {
  return path.join(getDataDir(), 'reel_comments.json');
}

function getLikesFilePath(): string {
  return path.join(getDataDir(), 'reel_likes.json');
}

function getSavesFilePath(): string {
  return path.join(getDataDir(), 'reel_saves.json');
}

export const INITIAL_SEED_REELS: ReelItem[] = [
  {
    id: 'reel-btth-flame-lotus',
    title: "Xiao Yan's Angry Buddha Lotus Transformation! 🔥",
    description: 'Watch Xiao Yan fuse Green Lotus Lotus Flame with Bone Chilling Flame in mid-air to create the ultimate destruction move!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    creatorId: 'admin_decent',
    creatorName: 'Decent Animation Official',
    seriesId: 'btth-three-year-agreement',
    seriesName: 'Battle Through the Heavens',
    episodeId: 'btth-three-year-agreement',
    episodeNumber: 12,
    hashtags: ['#BTTH', '#XiaoYan', '#DonghuaHighlights', '#Cultivation', '#HeavenlyFlame'],
    accessType: 'free',
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    views: 42150,
    likesCount: 5230,
    commentsCount: 148,
    sharesCount: 620,
    savesCount: 910,
  },
  {
    id: 'reel-renegade-ji-realm',
    title: "Wang Lin's Ji Realm Divine Sense Unleashed ⚡",
    description: 'The Sea of Devils trembles as Wang Lin activates his deadly Ji Realm domain. One gaze, infinite destruction.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    creatorId: 'admin_decent',
    creatorName: 'Decent Animation Official',
    seriesId: 'renegade-immortal-ep24',
    seriesName: 'Renegade Immortal (Xian Ni)',
    episodeId: 'renegade-immortal-ep24',
    episodeNumber: 24,
    hashtags: ['#XianNi', '#WangLin', '#RuthlessMC', '#JiRealm', '#DecentDonghua'],
    accessType: 'free',
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    views: 38900,
    likesCount: 6840,
    commentsCount: 215,
    sharesCount: 840,
    savesCount: 1250,
  },
  {
    id: 'reel-soul-land-hammer',
    title: 'Clear Sky Hammer vs Spirit Hall Elders! 🔨',
    description: 'Tang San reveals the ancient Clear Sky Hammer in front of the Spirit Hall Pontiff. The ground shakes with thunderous force.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    creatorId: 'admin_decent',
    creatorName: 'Decent Animation Official',
    seriesId: 'soul-land-ep1',
    seriesName: 'Soul Land (Douluo Dalu)',
    episodeId: 'soul-land-ep1',
    episodeNumber: 1,
    hashtags: ['#SoulLand', '#TangSan', '#ClearSkyHammer', '#MartialSouls'],
    accessType: 'free',
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    views: 51200,
    likesCount: 7910,
    commentsCount: 310,
    sharesCount: 1100,
    savesCount: 1480,
  },
  {
    id: 'reel-swallowed-star-gold',
    title: 'Luo Feng Golden Horned Beast Awakening! 🌌',
    description: 'Luo Feng encounters the planetary horror in deep space. Watch the transformation of the celestial warrior!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyflights.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    creatorId: 'admin_decent',
    creatorName: 'Decent Animation Official',
    seriesId: 'swallowed-star-ep85',
    seriesName: 'Swallowed Star (Tunshi Xingkong)',
    episodeId: 'swallowed-star-ep85',
    episodeNumber: 85,
    hashtags: ['#SwallowedStar', '#LuoFeng', '#SciFiDonghua', '#SpaceCultivation'],
    accessType: 'free',
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    views: 29400,
    likesCount: 4890,
    commentsCount: 172,
    sharesCount: 510,
    savesCount: 820,
  },
  {
    id: 'reel-perfect-world-bone',
    title: 'Shi Hao Supreme Bone Rebirth Battle! 🐉',
    description: 'Shi Hao unleashes the Kunpeng technique in the Void Domain! Epic high-definition donghua action.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    creatorId: 'admin_decent',
    creatorName: 'Decent Animation Official',
    seriesId: 'perfect-world-ep120',
    seriesName: 'Perfect World (Wanmei Shijie)',
    episodeId: 'perfect-world-ep120',
    episodeNumber: 120,
    hashtags: ['#PerfectWorld', '#ShiHao', '#Kunpeng', '#AncientCultivation'],
    accessType: 'free',
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    views: 31050,
    likesCount: 5620,
    commentsCount: 198,
    sharesCount: 730,
    savesCount: 1040,
  },
];

export function readReelsFromStore(): ReelItem[] {
  const filePath = getReelsFilePath();
  if (!fs.existsSync(filePath)) {
    writeReelsToStore(INITIAL_SEED_REELS);
    return INITIAL_SEED_REELS;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('Error reading reels file store, re-seeding:', e);
  }
  writeReelsToStore(INITIAL_SEED_REELS);
  return INITIAL_SEED_REELS;
}

export function writeReelsToStore(reels: ReelItem[]): void {
  const filePath = getReelsFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(reels, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write reels to file store:', e);
  }
}

export function readReelComments(reelId: string): ReelCommentItem[] {
  const filePath = getCommentsFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const allComments: Record<string, ReelCommentItem[]> = JSON.parse(raw);
    return allComments[reelId] || [];
  } catch {
    return [];
  }
}

export function writeReelComment(comment: ReelCommentItem): ReelCommentItem[] {
  const filePath = getCommentsFilePath();
  let allComments: Record<string, ReelCommentItem[]> = {};
  if (fs.existsSync(filePath)) {
    try {
      allComments = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      allComments = {};
    }
  }
  if (!allComments[comment.reelId]) {
    allComments[comment.reelId] = [];
  }
  allComments[comment.reelId].unshift(comment);
  fs.writeFileSync(filePath, JSON.stringify(allComments, null, 2), 'utf-8');

  // Update comment count on reel
  const reels = readReelsFromStore();
  const index = reels.findIndex((r) => r.id === comment.reelId);
  if (index !== -1) {
    reels[index].commentsCount = (reels[index].commentsCount || 0) + 1;
    writeReelsToStore(reels);
  }

  return allComments[comment.reelId];
}

// User Likes store: Record<reelId, Record<userId, boolean>>
export function readReelLikeState(reelId: string, userId: string): boolean {
  const filePath = getLikesFilePath();
  if (!fs.existsSync(filePath)) return false;
  try {
    const allLikes: Record<string, Record<string, boolean>> = JSON.parse(
      fs.readFileSync(filePath, 'utf-8')
    );
    return Boolean(allLikes[reelId]?.[userId]);
  } catch {
    return false;
  }
}

export function toggleReelLikeState(reelId: string, userId: string): { liked: boolean; likesCount: number } {
  const filePath = getLikesFilePath();
  let allLikes: Record<string, Record<string, boolean>> = {};
  if (fs.existsSync(filePath)) {
    try {
      allLikes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      allLikes = {};
    }
  }
  if (!allLikes[reelId]) {
    allLikes[reelId] = {};
  }
  const currentlyLiked = Boolean(allLikes[reelId][userId]);
  const nextLiked = !currentlyLiked;
  allLikes[reelId][userId] = nextLiked;
  fs.writeFileSync(filePath, JSON.stringify(allLikes, null, 2), 'utf-8');

  // Update reel likes count
  const reels = readReelsFromStore();
  const index = reels.findIndex((r) => r.id === reelId);
  let newLikesCount = 0;
  if (index !== -1) {
    const delta = nextLiked ? 1 : -1;
    reels[index].likesCount = Math.max(0, (reels[index].likesCount || 0) + delta);
    newLikesCount = reels[index].likesCount || 0;
    writeReelsToStore(reels);
  }

  return { liked: nextLiked, likesCount: newLikesCount };
}

// User Saves store: Record<userId, Record<reelId, boolean>>
export function readReelSaveState(reelId: string, userId: string): boolean {
  const filePath = getSavesFilePath();
  if (!fs.existsSync(filePath)) return false;
  try {
    const allSaves: Record<string, Record<string, boolean>> = JSON.parse(
      fs.readFileSync(filePath, 'utf-8')
    );
    return Boolean(allSaves[userId]?.[reelId]);
  } catch {
    return false;
  }
}

export function toggleReelSaveState(reelId: string, userId: string): { saved: boolean; savesCount: number } {
  const filePath = getSavesFilePath();
  let allSaves: Record<string, Record<string, boolean>> = {};
  if (fs.existsSync(filePath)) {
    try {
      allSaves = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      allSaves = {};
    }
  }
  if (!allSaves[userId]) {
    allSaves[userId] = {};
  }
  const currentlySaved = Boolean(allSaves[userId][reelId]);
  const nextSaved = !currentlySaved;
  allSaves[userId][reelId] = nextSaved;
  fs.writeFileSync(filePath, JSON.stringify(allSaves, null, 2), 'utf-8');

  // Update reel saves count
  const reels = readReelsFromStore();
  const index = reels.findIndex((r) => r.id === reelId);
  let newSavesCount = 0;
  if (index !== -1) {
    const delta = nextSaved ? 1 : -1;
    reels[index].savesCount = Math.max(0, (reels[index].savesCount || 0) + delta);
    newSavesCount = reels[index].savesCount || 0;
    writeReelsToStore(reels);
  }

  return { saved: nextSaved, savesCount: newSavesCount };
}

export function incrementReelView(reelId: string): number {
  const reels = readReelsFromStore();
  const index = reels.findIndex((r) => r.id === reelId);
  if (index !== -1) {
    reels[index].views = (reels[index].views || 0) + 1;
    writeReelsToStore(reels);
    return reels[index].views;
  }
  return 0;
}
