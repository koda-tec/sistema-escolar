/**
 * MOTOR DE LA PWA (Generado por Next-PWA / Workbox)
 * NO BORRAR ESTA PARTE: Maneja el caché y funcionamiento offline.
 */
if(!self.define){let e,a={};const s=(s,n)=>(s=new URL(s+".js",n).href,a[s]||new Promise(a=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=a,document.head.appendChild(e)}else e=s,importScripts(s),a()}).then(()=>{let e=a[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e}));self.define=(n,i)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(a[c])return;let t={};const r=e=>s(e,c),d={module:{uri:c},exports:t,require:r};a[c]=Promise.all(n.map(e=>d[e]||r(e))).then(e=>(i(...e),t))}}define(["./workbox-f1770938"],function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute(self.__WB_MANIFEST || [],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET")});

/**
 * LÓGICA DE NOTIFICACIONES PUSH KODAED
 * Esta parte escucha los mensajes del servidor.
 */
self.addEventListener('push', function (event) {
  console.log('☁️ Push recibida en el dispositivo...');
  
  // Valores por defecto por si falla el parseo
  let data = { 
    title: 'Aviso de KodaEd', 
    body: 'Tienes una nueva notificación de la escuela.',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      // Intentamos leer el JSON enviado desde el servidor
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || data.body;
      data.url = payload.url || data.url;
    } catch (e) {
      console.warn("⚠️ No se pudo parsear el JSON, usando texto plano o default");
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png', // Asegúrate de que esta ruta sea correcta
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'inasistencia-notif', // Agrupa notificaciones iguales
    renotify: true,
    data: {
      url: data.url
    },
    // Esto hace que la notificación se vea más "nativa" en Android
    actions: [
      { action: 'open', title: 'Ver detalle' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});