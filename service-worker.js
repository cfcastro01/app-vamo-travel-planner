const CACHE_NAME = 'viagem-pwa-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './img/icon-192.png',
    './img/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
});