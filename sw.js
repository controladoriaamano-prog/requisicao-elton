/* Service Worker — REQUISIÇÃO ELTON
   Estratégia: HTML sempre network-first (pega sempre a versão nova),
   assets estáticos em cache-first. Assim as atualizações chegam sem cache preso. */
const CACHE = 'req-elton-v3';
const ASSETS = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase / CDNs passam direto

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // Network-first com bypass de cache HTTP
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', cp)).catch(() => {});
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first para assets
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(r => {
      if (r && r.status === 200) {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
      }
      return r;
    }).catch(() => cached))
  );
});
