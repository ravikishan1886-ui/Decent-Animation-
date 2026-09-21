/**
 * Centralized Notification Service for Decent Animation Platform
 * Handles Transactional Emails (Resend / SendGrid), Web Push / FCM,
 * Expiry Reminders with Duplicate Prevention, and Firestore Logging.
 */

import {
  getNewUserAdminTemplate,
  getSubscriptionSuccessTemplate,
  getSubscriptionExpiryReminderTemplate,
  getSubscriptionExpiredTemplate,
  getPasswordResetConfirmationTemplate,
  getNewContentNotificationTemplate,
} from './email-templates';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { NotificationLog, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from './types';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  type: NotificationLog['type'];
  subscriptionId?: string;
  videoId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  channel: 'email' | 'push';
  provider: 'resend' | 'sendgrid' | 'direct_gateway';
  error?: string;
  simulated?: boolean;
}

/**
 * Low-level transactional email dispatcher supporting Resend & SendGrid REST APIs
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendResult> {
  const fromEmail = process.env.EMAIL_FROM || 'Decent Animation <notifications@decentanimation.com>';
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  let result: SendResult = {
    success: false,
    channel: 'email',
    provider: 'direct_gateway',
  };

  try {
    if (resendApiKey) {
      // 1. Send via Resend REST API
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        result = {
          success: true,
          messageId: resData.id,
          channel: 'email',
          provider: 'resend',
        };
      } else {
        result = {
          success: false,
          error: resData.message || 'Resend delivery failed',
          channel: 'email',
          provider: 'resend',
        };
      }
    } else if (sendgridApiKey) {
      // 2. Send via SendGrid v3 API
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: fromEmail.includes('<') ? fromEmail.split('<')[1].replace('>', '').trim() : fromEmail },
          subject: options.subject,
          content: [{ type: 'text/html', value: options.html }],
        }),
      });

      if (res.ok || res.status === 202) {
        result = {
          success: true,
          channel: 'email',
          provider: 'sendgrid',
        };
      } else {
        const text = await res.text();
        result = {
          success: false,
          error: text || 'SendGrid delivery failed',
          channel: 'email',
          provider: 'sendgrid',
        };
      }
    } else {
      // 3. Fallback direct gateway log (Ensures system never crashes when API key is being configured)
      console.log(`[TRANSACTIONAL EMAIL GATEWAY] To: ${options.to} | Subject: ${options.subject}`);
      result = {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        channel: 'email',
        provider: 'direct_gateway',
        simulated: true,
      };
    }

    // Persist notification log to Firestore
    await logNotificationToFirestore({
      userId: options.userId || 'anonymous',
      userEmail: options.to,
      type: options.type,
      subscriptionId: options.subscriptionId,
      videoId: options.videoId,
      recipient: options.to,
      subject: options.subject,
      channel: 'email',
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error,
    });
  } catch (err: any) {
    console.error('Email dispatch error:', err);
    result = {
      success: false,
      channel: 'email',
      provider: 'direct_gateway',
      error: err.message || 'Failed to dispatch email',
    };
  }

  return result;
}

/**
 * Persist delivery logs in Firestore with timestamp and metadata
 */
export async function logNotificationToFirestore(data: {
  userId: string;
  userEmail?: string;
  type: NotificationLog['type'];
  subscriptionId?: string;
  videoId?: string;
  recipient: string;
  subject?: string;
  channel: 'email' | 'push';
  status: 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
}) {
  try {
    const timestamp = new Date().toISOString();
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'notificationLogs', logId);

    const logRecord: NotificationLog = {
      id: logId,
      userId: data.userId,
      userEmail: data.userEmail || data.recipient,
      type: data.type,
      subscriptionId: data.subscriptionId,
      videoId: data.videoId,
      sentAt: timestamp,
      channel: data.channel,
      status: data.status,
      recipient: data.recipient,
      subject: data.subject,
      errorMessage: data.errorMessage,
      createdAt: timestamp,
    };

    await setDoc(logRef, logRecord);
  } catch (err) {
    console.warn('Failed to write notification log to Firestore:', err);
  }
}

/**
 * Check if a reminder has already been sent to prevent duplicates
 */
export async function hasNotificationBeenSent(
  userId: string,
  type: NotificationLog['type'],
  subscriptionId?: string,
  timeWindowDays: number = 2
): Promise<boolean> {
  try {
    const logsRef = collection(db, 'notificationLogs');
    let q = query(
      logsRef,
      where('userId', '==', userId),
      where('type', '==', type),
      where('status', '==', 'sent')
    );

    if (subscriptionId) {
      q = query(
        logsRef,
        where('userId', '==', userId),
        where('type', '==', type),
        where('subscriptionId', '==', subscriptionId),
        where('status', '==', 'sent')
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    // Check if the log is within the recent window
    const now = new Date().getTime();
    const windowMs = timeWindowDays * 24 * 60 * 60 * 1000;

    return snapshot.docs.some((docSnap) => {
      const data = docSnap.data();
      const sentTime = new Date(data.sentAt || data.createdAt).getTime();
      return now - sentTime < windowMs;
    });
  } catch (err) {
    console.warn('Error checking duplicate notifications:', err);
    return false;
  }
}

/**
 * Helper: Retrieve user notification preferences
 */
export async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
    }
  } catch (err) {
    console.warn('Could not fetch user preferences:', err);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

// =============================================================================
// HIGHER-LEVEL EVENT DISPATCHERS
// =============================================================================

/**
 * EVENT: USER_CREATED
 * Notifies platform admin when a new user registers
 */
export async function handleUserCreatedEvent(data: {
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt?: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'videocinema80@gmail.com';
  const registeredAt = data.registeredAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const html = getNewUserAdminTemplate({
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    registeredAt,
  });

  return sendTransactionalEmail({
    to: adminEmail,
    subject: 'New User Registered - Decent Animation',
    html,
    userId: data.userId,
    type: 'USER_CREATED',
  });
}

/**
 * EVENT: SUBSCRIPTION_PURCHASED
 * Notifies subscriber with VIP activation details and benefits, plus admin alert
 */
export async function handleSubscriptionPurchasedEvent(data: {
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  startDate: string;
  expiryDate: string;
  watchUrl?: string;
}) {
  // Check user preferences
  const prefs = await getUserPreferences(data.userId);
  if (!prefs.subscriptionEmails) {
    await logNotificationToFirestore({
      userId: data.userId,
      userEmail: data.userEmail,
      type: 'SUBSCRIPTION_PURCHASED',
      subscriptionId: data.planId,
      recipient: data.userEmail,
      channel: 'email',
      status: 'skipped',
      errorMessage: 'User opted out of subscription emails',
    });
    return { success: true, skipped: true, channel: 'email', provider: 'direct_gateway' as const };
  }

  const html = getSubscriptionSuccessTemplate({
    userName: data.userName,
    planName: data.planName,
    amount: data.amount,
    startDate: data.startDate,
    expiryDate: data.expiryDate,
    watchUrl: data.watchUrl,
  });

  const sendResult = await sendTransactionalEmail({
    to: data.userEmail,
    subject: 'Subscription Activated - Decent Animation',
    html,
    userId: data.userId,
    type: 'SUBSCRIPTION_PURCHASED',
    subscriptionId: data.planId,
  });

  // Also send Admin notification for purchase
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'videocinema80@gmail.com';
  if (adminEmail && adminEmail !== data.userEmail) {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `New Subscription Purchase: ₹${data.amount} (${data.planName})`,
      html: `
        <div style="font-family: sans-serif; background: #111; color: #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f59e0b;">New Subscription Purchase</h2>
          <p><strong>User:</strong> ${data.userName} (${data.userEmail})</p>
          <p><strong>Plan:</strong> ${data.planName} (₹${data.amount})</p>
          <p><strong>Valid Until:</strong> ${data.expiryDate}</p>
          <p><strong>User ID:</strong> ${data.userId}</p>
        </div>
      `,
      userId: data.userId,
      type: 'SUBSCRIPTION_PURCHASED',
      subscriptionId: data.planId,
    });
  }

  return sendResult;
}

/**
 * EVENT: PASSWORD_RESET_CONFIRMATION
 */
export async function handlePasswordResetConfirmationEvent(data: {
  userEmail: string;
  userName?: string;
  userId?: string;
}) {
  const resetTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = getPasswordResetConfirmationTemplate({
    userEmail: data.userEmail,
    userName: data.userName,
    resetTime,
  });

  return sendTransactionalEmail({
    to: data.userEmail,
    subject: 'Your Decent Animation password was successfully reset',
    html,
    userId: data.userId,
    type: 'PASSWORD_RESET_CONFIRMATION',
  });
}

/**
 * EVENT: VIDEO_PUBLISHED
 * Broadcast to users who have opted into new content notifications
 */
export async function handleVideoPublishedEvent(video: {
  id: string;
  title: string;
  episodeNumber?: number;
  donghuaName?: string;
  thumbnailUrl: string;
  description: string;
}) {
  try {
    const usersRef = collection(db, 'users');
    const userSnap = await getDocs(usersRef);

    const watchUrl = `https://decentanimation.com/watch/${video.id}`;
    const html = getNewContentNotificationTemplate({
      title: video.title,
      episodeNumber: video.episodeNumber,
      seriesName: video.donghuaName,
      thumbnailUrl: video.thumbnailUrl,
      description: video.description,
      watchUrl,
    });

    let sentCount = 0;
    for (const userDoc of userSnap.docs) {
      const u = userDoc.data();
      const prefs: NotificationPreferences = u.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

      if (prefs.newContent && u.email) {
        await sendTransactionalEmail({
          to: u.email,
          subject: `New Donghua Episode Available: ${video.title}`,
          html,
          userId: u.uid || userDoc.id,
          type: 'VIDEO_PUBLISHED',
          videoId: video.id,
        });
        sentCount++;
      }
    }

    return { success: true, count: sentCount };
  } catch (err: any) {
    console.error('Failed to broadcast new content notifications:', err);
    return { success: false, error: err.message };
  }
}

/**
 * SCHEDULED JOB: Check active subscriptions and send 7-day, 3-day, 1-day, or expired reminders
 */
export async function checkAndSendSubscriptionExpiryReminders() {
  const stats = {
    checked: 0,
    sent7Day: 0,
    sent3Day: 0,
    sent1Day: 0,
    sentExpired: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    const subsRef = collection(db, 'subscriptions');
    const subsSnap = await getDocs(subsRef);

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (const subDoc of subsSnap.docs) {
      const sub = subDoc.data();
      if (!sub.expiryDate || !sub.userId) continue;

      stats.checked++;
      const expiryTime = new Date(sub.expiryDate).getTime();
      const diffMs = expiryTime - todayMidnight;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Get user profile for email & preferences
      const userDoc = await getDoc(doc(db, 'users', sub.userId));
      if (!userDoc.exists()) continue;
      const user = userDoc.data();
      const userEmail = user.email || sub.userEmail;
      const userName = user.name || 'Cultivator';
      const prefs: NotificationPreferences = user.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

      if (!prefs.expiryReminders) {
        stats.skipped++;
        continue;
      }

      // Check for 7 days remaining
      if (daysRemaining === 7) {
        const alreadySent = await hasNotificationBeenSent(sub.userId, 'SUBSCRIPTION_EXPIRY_7DAYS', subDoc.id, 5);
        if (!alreadySent) {
          const html = getSubscriptionExpiryReminderTemplate({
            userName,
            planName: sub.planName || 'VIP Plan',
            daysRemaining: 7,
            expiryDate: sub.expiryDate,
          });
          await sendTransactionalEmail({
            to: userEmail,
            subject: 'Your Decent Animation subscription expires in 7 days',
            html,
            userId: sub.userId,
            subscriptionId: subDoc.id,
            type: 'SUBSCRIPTION_EXPIRY_7DAYS',
          });
          stats.sent7Day++;
        }
      }

      // Check for 3 days remaining
      else if (daysRemaining === 3) {
        const alreadySent = await hasNotificationBeenSent(sub.userId, 'SUBSCRIPTION_EXPIRY_3DAYS', subDoc.id, 2);
        if (!alreadySent) {
          const html = getSubscriptionExpiryReminderTemplate({
            userName,
            planName: sub.planName || 'VIP Plan',
            daysRemaining: 3,
            expiryDate: sub.expiryDate,
          });
          await sendTransactionalEmail({
            to: userEmail,
            subject: 'Your Decent Animation subscription expires in 3 days',
            html,
            userId: sub.userId,
            subscriptionId: subDoc.id,
            type: 'SUBSCRIPTION_EXPIRY_3DAYS',
          });
          stats.sent3Day++;
        }
      }

      // Check for 1 day remaining
      else if (daysRemaining === 1) {
        const alreadySent = await hasNotificationBeenSent(sub.userId, 'SUBSCRIPTION_EXPIRY_1DAY', subDoc.id, 1);
        if (!alreadySent) {
          const html = getSubscriptionExpiryReminderTemplate({
            userName,
            planName: sub.planName || 'VIP Plan',
            daysRemaining: 1,
            expiryDate: sub.expiryDate,
          });
          await sendTransactionalEmail({
            to: userEmail,
            subject: 'Urgent: Your Decent Animation subscription expires tomorrow',
            html,
            userId: sub.userId,
            subscriptionId: subDoc.id,
            type: 'SUBSCRIPTION_EXPIRY_1DAY',
          });
          stats.sent1Day++;
        }
      }

      // Check if expired today (daysRemaining <= 0 and >= -1)
      else if (daysRemaining <= 0 && daysRemaining >= -2 && sub.status === 'active') {
        const alreadySent = await hasNotificationBeenSent(sub.userId, 'SUBSCRIPTION_EXPIRED', subDoc.id, 7);
        if (!alreadySent) {
          const html = getSubscriptionExpiredTemplate({
            userName,
            planName: sub.planName || 'VIP Plan',
          });
          await sendTransactionalEmail({
            to: userEmail,
            subject: 'Your Decent Animation subscription has expired',
            html,
            userId: sub.userId,
            subscriptionId: subDoc.id,
            type: 'SUBSCRIPTION_EXPIRED',
          });
          stats.sentExpired++;
        }
      }
    }
  } catch (err: any) {
    console.error('Subscription reminder job error:', err);
    stats.errors.push(err.message);
  }

  return stats;
}
