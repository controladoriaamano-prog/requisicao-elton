/* Service Worker — REQUISIÇÃO ELTON
   - App funciona OFFLINE (app shell + SDK Firebase em cache)
   - Sempre busca a versão nova quando ONLINE (network-first no HTML)
   - Ativa a nova versão imediatamente (skipWaiting) para forçar atualização
*/
const CACHE = 'req-elton-offline-v4';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'CACHE_URLS' && Array.isArray(e.data.urls)) {
    e.waitUntil(caches.open(CACHE).then(c =>
      Promise.all(e.data.urls.map(u => c.add(u).catch(() => {})))
    ));
  }
});

async function networkFirstHTML(req) {
  const c = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh && fresh.ok) c.put('./index.html', fresh.clone());
    return fresh;
  } catch (e) {
    return (await c.match(req)) || (await c.match('./index.html')) || (await c.match('./'));
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // SDK do Firebase (gstatic) — cache-first (essencial para abrir offline)
  if (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') !== -1) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        c.put(req, r.clone()).catch(() => {});
        return r;
      } catch (err) { return hit; }
    })());
    return;
  }

  // Outras origens (Firebase RTDB, etc.) passam direto pela rede
  if (url.origin !== location.origin) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isHTML) { e.respondWith(networkFirstHTML(req)); return; }

  // Estáticos mesmo domínio — cache-first com revalidação em background
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) {
      fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const r = await fetch(req);
      if (r && r.ok) c.put(req, r.clone());
      return r;
    } catch (err) { return hit; }
  })());
});
