// Service Worker for Zeshopp Chat Push Notifications
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'zeshopp-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Zeshopp Chat',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: data.tag === 'incoming-call',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if ('focus' in client) {
          // Handle call actions
          if (action === 'accept' && data.roomId) {
            client.postMessage({ type: 'CALL_ACCEPT', roomId: data.roomId });
          } else if (action === 'reject' && data.roomId) {
            client.postMessage({ type: 'CALL_REJECT', roomId: data.roomId });
          }
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        const url = data.url || '/';
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLOSE_NOTIFICATION') {
    self.registration.getNotifications({ tag: event.data.tag }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});

export {};
