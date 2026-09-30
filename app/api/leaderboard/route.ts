import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { LeaderboardEntry, UserProfile, SuperChatItem } from '@/lib/types';
import { getUserPlan } from '@/lib/authorization';

let FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'usr_sword_immortal',
    username: 'Sword Immortal Li',
    profileImage: '',
    plan: 'vip',
    isVip: true,
    isPremium: true,
    superChatTotal: 5200,
    badge: '🏆 Top Supporter',
    isAnonymous: false,
  },
  {
    rank: 2,
    userId: 'usr_flame_emperor',
    username: 'Flame Sovereign Xiao',
    profileImage: '',
    plan: 'vip',
    isVip: true,
    isPremium: true,
    superChatTotal: 3400,
    badge: '🏆 Top Supporter',
    isAnonymous: false,
  },
  {
    rank: 3,
    userId: 'usr_cloud_sage',
    username: 'Cloud Sage Chen',
    profileImage: '',
    plan: 'premium',
    isVip: false,
    isPremium: true,
    superChatTotal: 1850,
    badge: '💎💎 Super Supporter',
    isAnonymous: false,
  },
  {
    rank: 4,
    userId: 'usr_ghost_blade',
    username: 'Blade of the Void',
    profileImage: '',
    plan: 'premium',
    isVip: false,
    isPremium: true,
    superChatTotal: 920,
    badge: '💎 Supporter',
    isAnonymous: false,
  },
  {
    rank: 5,
    userId: 'usr_mystic_lotus',
    username: 'Mystic Lotus Maiden',
    profileImage: '',
    plan: 'basic',
    isVip: false,
    isPremium: false,
    superChatTotal: 500,
    badge: '💎 Supporter',
    isAnonymous: false,
  },
  {
    rank: 6,
    userId: 'usr_anon_elder',
    username: 'Anonymous Cultivator',
    profileImage: '',
    plan: 'vip',
    isVip: true,
    isPremium: true,
    superChatTotal: 350,
    badge: '💎 Supporter',
    isAnonymous: true,
  },
  {
    rank: 7,
    userId: 'usr_thunder_fist',
    username: 'Thunder Palm Daoist',
    profileImage: '',
    plan: 'basic',
    isVip: false,
    isPremium: false,
    superChatTotal: 200,
    badge: '💎 Supporter',
    isAnonymous: false,
  },
  {
    rank: 8,
    userId: 'usr_novice_ling',
    username: 'Disciple Ling',
    profileImage: '',
    plan: 'free',
    isVip: false,
    isPremium: false,
    superChatTotal: 50,
    badge: '🗡️ Basic Cultivator',
    isAnonymous: false,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all_time'; // 'all_time', 'monthly', 'live'
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);

    const userMap = new Map<string, { user: UserProfile; total: number }>();

    try {
      // First gather users
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        const uid = u.uid || d.id;
        userMap.set(uid, { user: u, total: u.superChatTotal || 0 });
      });

      // Also sum verified super chats for precision
      const superChatsSnap = await getDocs(collection(db, 'superChats'));
      const scTotals = new Map<string, number>();

      superChatsSnap.forEach((d) => {
        const sc = d.data() as SuperChatItem;
        if (sc.status === 'verified' && sc.userId) {
          const current = scTotals.get(sc.userId) || 0;
          scTotals.set(sc.userId, current + (Number(sc.amount) || 0));
        }
      });

      // Update map with aggregated superchat amounts if higher
      scTotals.forEach((total, uid) => {
        const entry = userMap.get(uid);
        if (entry) {
          entry.total = Math.max(entry.total, total);
        }
      });
    } catch (e) {
      console.warn('Firestore leaderboard query notice:', e);
    }

    let entries: LeaderboardEntry[] = [];

    userMap.forEach(({ user, total }, uid) => {
      if (total > 0 || user.role === 'admin' || user.subscriptionStatus === 'active') {
        const plan = getUserPlan(user);
        const isVip = plan === 'vip' || user.role === 'admin';
        const isPremium = isVip || plan === 'premium';
        const isAnon = user.showOnLeaderboard === false;

        let badge = '🗡️ Basic Cultivator';
        if (user.role === 'admin') badge = '🛡️ Grand Administrator';
        else if (total >= 1000) badge = '🏆 Top Supporter';
        else if (total >= 200) badge = '💎💎 Super Supporter';
        else if (total >= 50) badge = '💎 Supporter';
        else if (isVip) badge = '👑 VIP Cultivator';
        else if (isPremium) badge = '⭐ Premium Cultivator';

        entries.push({
          rank: 0,
          userId: uid,
          username: isAnon ? 'Anonymous Cultivator' : user.username || user.name || user.email?.split('@')[0] || 'Cultivator',
          profileImage: isAnon ? '' : user.profileImage || '',
          plan,
          isVip,
          isPremium,
          superChatTotal: total,
          badge,
          isAnonymous: isAnon,
        });
      }
    });

    if (entries.length === 0) {
      entries = FALLBACK_LEADERBOARD;
    }

    // Sort descending by superChatTotal, then by VIP status
    entries.sort((a, b) => {
      if (b.superChatTotal !== a.superChatTotal) {
        return b.superChatTotal - a.superChatTotal;
      }
      if (b.isVip && !a.isVip) return 1;
      if (!b.isVip && a.isVip) return -1;
      return 0;
    });

    // Assign 1-indexed ranks
    const ranked = entries.slice(0, limitCount).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: ranked,
      totalCount: ranked.length,
    });
  } catch (err: any) {
    console.error('Leaderboard GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
