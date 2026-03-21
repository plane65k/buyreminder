// sw-test.js - Service Worker for Push Notification Testing
const CACHE_NAME = 'push-test-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received!', event);
  
  let title = '🛍️ Shopping Reminder';
  let options = {
    body: 'Time to check your shopping list!',
    icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: '/'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
    } catch(e) {
      options.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (let client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
});
