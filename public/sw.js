/**
 * KodaEd Service Worker - Versión Final
 * Maneja el funcionamiento Offline (Workbox) y las Notificaciones Push.
 */

// --- 1. MOTOR DE LA PWA (NO TOCAR ESTA PARTE) ---
if(!self.define){let e,a={};const s=(s,n)=>(s=new URL(s+".js",n).href,a[s]||new Promise(a=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=a,document.head.appendChild(e)}else e=s,importScripts(s),a()}).then(()=>{let e=a[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e}));self.define=(n,i)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(a[c])return;let t={};const r=e=>s(e,c),d={module:{uri:c},exports:t,require:r};a[c]=Promise.all(n.map(e=>d[e]||r(e))).then(e=>(i(...e),t))}}define(["./workbox-f1770938"],function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute(self.__WB_MANIFEST || [],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET")});

// --- 2. ESCUCHADOR DE NOTIFICACIONES PUSH ---

self.addEventListener('push', function (event) {
  console.log('📥 Señal Push recibida de KodaEd');

  // Datos por defecto por si falla el procesamiento
  let data = {
    title: 'Aviso de KodaEd',
    body: 'Tienes una nueva notificación de la institución.',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      // Intentamos procesar el JSON enviado desde el servidor (sender.ts)
      const json = event.data.json();
      data.title = json.title || data.title;
      data.body = json.body || data.body;
      data.url = json.url || data.url;
    } catch (e) {
      console.error("⚠️ Error parseando JSON del Push, usando texto plano:", e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'kodaed-notification', // Evita que se dupliquen notificaciones idénticas
    renotify: true,
    data: {
      url: data.url
    }
  };

  // event.waitUntil asegura que el navegador no mate al Service Worker 
  // antes de que termine de mostrar la notificación física.
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// --- 3. LÓGICA AL HACER CLIC EN LA NOTIFICACIÓN ---

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Cierra el globo de la notificación

  // Intentamos abrir la App en la URL que mandó el servidor
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      const urlToOpen = event.notification.data.url || '/dashboard';

      // Si la App ya está abierta, la ponemos en foco y navegamos
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Si la App está cerrada, la abrimos
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});