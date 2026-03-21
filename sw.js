// sw.js - Service Worker for Apple Web Push
// Follows Apple's official Web Push specification

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications (Apple Web Push)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let title = '🛍️ Shopping Reminder';
  let options = {
    body: 'Time to check your shopping list!',
    icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,  // Important for iOS
    data: {
      url: '/'
    }
  };
  
  // Parse push data if present
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
  
  // Show notification immediately (required by Safari)
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
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
