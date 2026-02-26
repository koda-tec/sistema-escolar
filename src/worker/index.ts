/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// OBLIGATORIO: Esto inyecta el manifiesto de Next.js
precacheAndRoute(self.__WB_MANIFEST || []);
clientsClaim();
self.skipWaiting();

// ESCUCHADOR DE PUSH (Tu código está perfecto, mantenelo así)
self.addEventListener('push', (event: any) => {
  // 1. Valores por defecto (si esto falla, al menos verás esto y no algo genérico)
  let title = '⚠️ Aviso de KodaEd';
  let body = 'Tienes una nueva novedad escolar.';
  let url = '/dashboard';

  try {
    if (event.data) {
      // 2. Intentamos parsear. Ojo: event.data.json() puede fallar si no es JSON.
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      url = payload.url || url;
    }
  } catch (e) {
    // 3. Si falló el JSON, probamos leerlo como texto plano
    console.warn("Fallo el JSON, leyendo texto plano");
    const text = event.data.text();
    if (text) body = text;
  }

    const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200], 
    tag: 'kodaed-notification',
    renotify: true,
    data: { url }
  };


  event.waitUntil(self.registration.showNotification(title, options));
});


// ESCUCHADOR DE CLIC
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/dashboard')
  );
});
