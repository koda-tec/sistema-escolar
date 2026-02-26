/// <reference lib="webworker" />

export default null;
declare var self: ServiceWorkerGlobalScope;

// ESCUCHADOR DE PUSH
self.addEventListener('push', (event: PushEvent) => {
  let data = {
    title: 'KodaEd',
    body: 'Tienes una nueva notificación.',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      data = event.data.json();
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
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) client = clientList[i];
        }
        // @ts-ignore
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data.url);
    })
  );
});