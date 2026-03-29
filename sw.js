const CACHE = 'tomislav-202603292007';
const ASSETS = [
  './index.html',
  './manifest.json',
  './templates/putni_nalog.xlsx',
  './templates/kvar_template.xlsx'
];

// CDN libraries to cache for offline use
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.emailjs.com/dist/email.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all([
        c.addAll(ASSETS),
        ...CDN_ASSETS.map(url => fetch(url).then(r => c.put(url, r)).catch(() => {}))
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // ALL requests - Network first, fallback to cache (works offline after first load)
  e.respondWith(
    fetch(e.request).then(resp => {
      const clone = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
