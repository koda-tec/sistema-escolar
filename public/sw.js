/**
 * KodaEd Service Worker
 * Este archivo maneja el caché de la PWA y las Notificaciones Push.
 */

if(!self.define){let e,a={};const s=(s,n)=>(s=new URL(s+".js",n).href,a[s]||new Promise(a=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=a,document.head.appendChild(e)}else e=s,importScripts(s),a()}).then(()=>{let e=a[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e}));self.define=(n,i)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(a[c])return;let t={};const r=e=>s(e,c),d={module:{uri:c},exports:t,require:r};a[c]=Promise.all(n.map(e=>d[e]||r(e))).then(e=>(i(...e),t))}}define(["./workbox-f1770938"],function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute(self.__WB_MANIFEST || [],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET")});

// --- LÓGICA DE NOTIFICACIONES PUSH ---

self.addEventListener('push', function (event) {
  let data = { title: 'Aviso Escolar', body: 'Tienes una nueva notificación' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Si no es JSON, quizás es texto plano
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'inasistencia-tag', // Evita que se amontonen si llegan varias
    renotify: true,
    data: { url: data.url || '/dashboard' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
