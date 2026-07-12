const CACHE = 'ziju60plus-v3';
const STATIC = [
  '/', '/index.html', '/quiz.html', '/result.html',
  '/wow1.html', '/dekujeme.html', '/manifest.json',
  '/favicon.png', '/img/logo.png',
];

// Instalace – předcache statické stránky
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Aktivace – smaž staré cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch – network first pro API, cache first pro statiku
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API volání vždy ze sítě
  if (url.pathname.startsWith('/api/')) return;

  // Statické soubory – network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
