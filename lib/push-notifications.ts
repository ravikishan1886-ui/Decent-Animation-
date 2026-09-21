/**
 * Decent Animation - Client Push Notification Service
 * Integrates Web Push API / Firebase Cloud Messaging (FCM) token acquisition
 */

import { app } from './firebase';

export async function requestPushPermission(userId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Push notifications are not supported by this browser.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Push notification permission was denied.' };
    }

    // Attempt FCM Messaging token if VAPID key is configured
    let fcmToken: string | undefined;
    try {
      const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      if (supported && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        const messaging = getMessaging(app);
        fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
      }
    } catch (fcmErr) {
      console.warn('FCM token acquisition notice:', fcmErr);
    }

    // Update user preferences on server
    await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        pushNotifications: true,
        fcmToken: fcmToken || null,
      }),
    });

    return { success: true, token: fcmToken };
  } catch (err: any) {
    console.error('Failed to request push notification permission:', err);
    return { success: false, error: err.message || 'Notification setup failed' };
  }
}
