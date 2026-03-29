// Version is passed as ?v=X.Y from index.html — drives cache key automatically
const SW_VERSION = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = 'tomislav-202603292023' + SW_VERSION;
const ASSETS = [
  './index.html',
  './manifest.json',
  './templates/putni_nalog.xlsx',
  './templates/kvar_template.xlsx'
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.emailjs.com/dist/email.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // Force bypass HTTP cache for local assets
      await Promise.all(ASSETS.map(url => {
        const req = new Request(url, { cache: 'reload' });
        return fetch(req).then(res => c.put(req, res)).catch(err => console.error('SW Install Error:', err));
      }));
      // Normal fetch for CDNs
      await Promise.all(CDN_ASSETS.map(url => {
        return fetch(url).then(r => c.put(url, r)).catch(() => {});
      }));
    })
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
  // Navigation requests: NETWORK FIRST, bypassing HTTP cache
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request.url, { cache: 'reload' }).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request.url, clone));
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Other requests: Network first, fallback to SW cache
  e.respondWith(
    fetch(e.request).then(resp => {
      const clone = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
