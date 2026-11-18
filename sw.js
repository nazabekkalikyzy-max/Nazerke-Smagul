// Анатомия атласы — офлайн жұмыс істеуге арналған service worker
const VERSION = 'atlas-v2';
const CORE = ['./', './index.html', './vendor.js', './topics.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const MODELS = ['./heart_real.js', './brain_real.js', './teeth_real.js', './eye_real.js', './heart.js', './brain.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => caches.open(VERSION).then(c => Promise.all(MODELS.map(u => c.add(u).catch(() => {}))))));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Беттің өзі: алдымен желіден (жаңа нұсқа үшін), болмаса кэштен
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Қалғаны (модельдер, скрипттер, қаріптер): алдымен кэштен
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return r;
    })));
  }
});
