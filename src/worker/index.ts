/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// OBLIGATORIO: Esto inyecta el manifiesto de Next.js
precacheAndRoute(self.__WB_MANIFEST || []);
clientsClaim();
self.skipWaiting();

// ESCUCHADOR DE PUSH (Tu código está perfecto, mantenelo así)
self.addEventListener('push', (event: PushEvent) => {
  let data = {
    title: 'KodaEd',
    body: 'Tienes una nueva notificación.',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options: any = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url },
    tag: 'kodaed-notification',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ESCUCHADOR DE CLIC
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/dashboard')
  );
});
