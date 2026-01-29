const CACHE_NAME = 'event-flow-v2'; // Increment version
const ASSETS = [
    './',
    './index.html',
    './admin.html',
    './login.html',
    './student.html',
    './register.html',
    './scanner.html',
    './manifest.json',
    './css/style.css',
    './js/utils.js',
    './js/app.js',
    './js/auth.js',
    './js/register.js',
    './js/scanner.js',
    './js/firebase-config.js',
    './js/db-firestore.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Stale-while-revalidate strategy
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            const fetchPromise = fetch(e.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                });
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});
