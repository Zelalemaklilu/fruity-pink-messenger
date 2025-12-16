// Firebase Cloud Messaging Service Worker
// This file should be in the public folder

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDFJ7EHuECoEo99wWVMMkffYoMP5bFXVkM",
  authDomain: "studio-8672600014-3dc36.firebaseapp.com",
  projectId: "studio-8672600014-3dc36",
  storageBucket: "studio-8672600014-3dc36.firebasestorage.app",
  messagingSenderId: "322857909990",
  appId: "1:322857909990:web:eddd94ff7decd2eac38527"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.chatId || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const chatId = event.notification.data?.chatId;
  const urlToOpen = chatId ? `/chat/${chatId}` : '/chats';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
