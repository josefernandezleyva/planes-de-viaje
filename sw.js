// Guarda la app para abrirla sin conexión y muestra los avisos del iPhone. Los datos vienen siempre de la hoja.
const CACHE = 'planes-de-viaje-v3-1';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
// Aviso que llega del servidor (Web Push). Siempre se muestra: el iPhone lo exige.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  const tareas = [self.registration.showNotification(d.t || 'Planes de viaje', {
    body: d.b || 'Hay novedades en tus planes de viaje', tag: d.g || undefined, data: { u: d.u || '' },
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' })];
  if (typeof d.n === 'number' && self.navigator && 'setAppBadge' in self.navigator)
    tareas.push((d.n > 0 ? self.navigator.setAppBadge(d.n) : self.navigator.clearAppBadge()).catch(() => {}));
  e.waitUntil(Promise.all(tareas));
});
// Al tocar el aviso: abre la app directo en la actividad
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.u) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.indexOf(self.registration.scope) === 0) { c.postMessage({ tipo: 'abrir', url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
