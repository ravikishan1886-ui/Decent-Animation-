import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, get, update, remove, set } from 'firebase/database';
import { isDesignatedAdmin } from '@/lib/admin-config';
import { RequiredPlan } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = (searchParams.get('query') || searchParams.get('q') || '').toLowerCase().trim();
    const adminEmail = req.headers.get('x-admin-email') || searchParams.get('adminEmail') || '';

    // Verify admin
    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    let usersList: any[] = [];

    if (rtdb) {
      try {
        const usersRef = ref(rtdb, 'users');
        const snap = await get(usersRef);
        if (snap.exists()) {
          const val = snap.val();
          Object.keys(val).forEach((key) => {
            const u = val[key];
            usersList.push({
              ...u,
              uid: u.uid || key,
              userId: u.userId || u.uid || key,
            });
          });
        }
      } catch (err) {
        console.warn('Realtime Database fetch users notice:', err);
      }
    }

    // Default designated admin if list is empty
    if (usersList.length === 0) {
      usersList = [
        {
          uid: 'usr_admin_master',
          userId: 'usr_admin_master',
          username: 'admin_decent',
          name: 'Grand Cultivator Admin',
          email: 'videocinema80@gmail.com',
          role: 'admin',
          plan: 'vip',
          currentPlan: 'vip',
          planStartDate: '2026-01-01T00:00:00.000Z',
          planExpiryDate: '2028-12-31T23:59:59.000Z',
          subscriptionStatus: 'active',
          profileImage: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          lastLogin: new Date().toISOString(),
        },
      ];
    }

    // Filter by query (Username, Email, User ID)
    if (searchQuery) {
      usersList = usersList.filter((u) => {
        const usernameMatch = (u.username || '').toLowerCase().includes(searchQuery);
        const nameMatch = (u.name || '').toLowerCase().includes(searchQuery);
        const emailMatch = (u.email || '').toLowerCase().includes(searchQuery);
        const uidMatch = (u.uid || u.userId || '').toLowerCase().includes(searchQuery);
        return usernameMatch || nameMatch || emailMatch || uidMatch;
      });
    }

    const now = Date.now();
    const enrichedUsers = usersList.map((u) => {
      const expiry = u.planExpiryDate || u.subscriptionExpiry;
      let daysRemaining = 0;
      let isExpired = false;

      if (expiry) {
        const diff = new Date(expiry).getTime() - now;
        if (diff > 0) {
          daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
          isExpired = true;
          daysRemaining = 0;
        }
      }

      const activePlan = u.plan || u.currentPlan || 'free';

      return {
        ...u,
        userId: u.userId || u.uid,
        username: u.username || u.name || u.email?.split('@')[0] || 'User',
        currentPlan: activePlan,
        plan: activePlan,
        daysRemaining,
        isExpired,
      };
    });

    return NextResponse.json({ success: true, users: enrichedUsers, total: enrichedUsers.length });
  } catch (err: any) {
    console.error('Admin users GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      userId,
      targetUserId,
      planId,
      plan,
      role,
      days,
      durationDays,
      customExpiryDate,
      adminEmail,
    } = body;
    const targetId = userId || targetUserId;

    // Verify admin
    if (!isDesignatedAdmin(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    if (!targetId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    if (!rtdb) {
      return NextResponse.json({ error: 'Realtime database connection unavailable.' }, { status: 503 });
    }

    const userRef = ref(rtdb, `users/${targetId}`);
    const snap = await get(userRef);
    const existingUser = snap.exists() ? snap.val() : null;
    const now = new Date();

    let updates: any = {
      updatedAt: now.toISOString(),
    };
    let logMessage = '';

    if (action === 'GIVE_PLAN' || action === 'CHANGE_PLAN') {
      const selectedPlan = (plan || planId || 'premium-monthly').toLowerCase();
      let tier: RequiredPlan = 'basic';
      if (selectedPlan.includes('vip')) tier = 'vip';
      else if (selectedPlan.includes('premium')) tier = 'premium';
      else if (selectedPlan.includes('free')) tier = 'free';

      let expiry = new Date();
      if (customExpiryDate) {
        expiry = new Date(customExpiryDate);
      } else {
        const numDays = days || durationDays ? Number(days || durationDays) : selectedPlan.includes('yearly') ? 365 : selectedPlan.includes('quarterly') ? 90 : 30;
        expiry.setDate(now.getDate() + numDays);
      }

      updates = {
        ...updates,
        plan: tier,
        currentPlan: tier,
        planId: selectedPlan,
        planStartDate: now.toISOString(),
        planExpiryDate: tier === 'free' ? null : expiry.toISOString(),
        subscriptionStatus: tier === 'free' ? 'none' : 'active',
      };
      logMessage = `Plan ${tier} assigned successfully to user ${targetId}`;
    } else if (action === 'EXTEND_DAYS' || action === 'EXTEND_SUBSCRIPTION') {
      const additionalDays = Number(days || durationDays || 30);
      let currentExpiry = existingUser?.planExpiryDate ? new Date(existingUser.planExpiryDate) : new Date();
      if (currentExpiry.getTime() < now.getTime()) {
        currentExpiry = new Date();
      }
      currentExpiry.setDate(currentExpiry.getDate() + additionalDays);

      updates = {
        ...updates,
        planExpiryDate: currentExpiry.toISOString(),
        subscriptionStatus: 'active',
      };
      logMessage = `Extended plan by ${additionalDays} days for user ${targetId}`;
    } else if (action === 'SET_EXPIRY') {
      if (!customExpiryDate) {
        return NextResponse.json({ error: 'Please provide a valid expiry date' }, { status: 400 });
      }
      const expiry = new Date(customExpiryDate);
      updates = {
        ...updates,
        planExpiryDate: expiry.toISOString(),
        subscriptionStatus: expiry.getTime() > now.getTime() ? 'active' : 'expired',
      };
      logMessage = `Updated plan expiry date to ${expiry.toLocaleDateString()}`;
    } else if (action === 'REMOVE_PLAN' || action === 'CANCEL_PLAN') {
      updates = {
        ...updates,
        plan: 'free',
        currentPlan: 'free',
        planId: null,
        planStartDate: null,
        planExpiryDate: null,
        subscriptionStatus: 'none',
      };
      logMessage = `Membership plan removed for user ${targetId}`;
    } else if (action === 'CHANGE_ROLE') {
      updates = {
        ...updates,
        role: role === 'admin' ? 'admin' : 'user',
      };
      logMessage = `User role changed to ${role} for user ${targetId}`;
    } else if (action === 'DELETE_USER') {
      await remove(userRef);
      return NextResponse.json({ success: true, message: `User ${targetId} deleted successfully.` });
    }

    if (existingUser) {
      await update(userRef, updates);
    } else {
      await set(userRef, {
        uid: targetId,
        username: 'User',
        email: '',
        role: 'user',
        plan: 'free',
        planStartDate: null,
        planExpiryDate: null,
        profileImage: '',
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
        ...updates,
      });
    }

    return NextResponse.json({
      success: true,
      message: logMessage || 'User updated successfully',
      updates,
    });
  } catch (err: any) {
    console.error('Admin users POST error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
