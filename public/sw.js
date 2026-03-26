const CACHE = 'eyeguard-v1'
const PRECACHE = ['/eyeguard/', '/eyeguard/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // Network-first for API/camera requests, cache-first for static assets
  if (e.request.url.includes('mediapipe') || e.request.url.includes('storage.googleapis')) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(e.request)
          .then((res) => { cache.put(e.request, res.clone()); return res })
          .catch(() => caches.match(e.request))
      )
    )
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    )
  }
})
