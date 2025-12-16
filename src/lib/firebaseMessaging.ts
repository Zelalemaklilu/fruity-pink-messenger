import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { getMessagingInstance, db, auth } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

let messaging: Messaging | null = null;

// Initialize messaging
export const initializeMessaging = async (): Promise<boolean> => {
  try {
    messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('Push notifications not supported in this browser');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return false;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      const initialized = await initializeMessaging();
      if (!initialized) return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token - Note: You need to add your VAPID key from Firebase Console
    // Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
    const token = await getToken(messaging!, {
      vapidKey: 'YOUR_VAPID_KEY' // User needs to replace this with their actual VAPID key
    });

    if (token) {
      console.log('FCM Token:', token);
      // Save token to Firestore for the current user
      await saveFCMToken(token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Save FCM token to Firestore
export const saveFCMToken = async (token: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await setDoc(doc(db, 'fcmTokens', user.uid), {
      token,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      platform: 'web'
    }, { merge: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) | null => {
  if (!messaging) {
    console.log('Messaging not initialized');
    return null;
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show toast notification
    const { notification } = payload;
    if (notification) {
      toast(notification.title || 'New Message', {
        description: notification.body,
      });
    }
    
    callback(payload);
  });
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Get current notification permission status
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Show local notification (when app is in foreground)
export const showLocalNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
};
