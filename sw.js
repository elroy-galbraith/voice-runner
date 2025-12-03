/**
 * Service Worker for Voice Runner
 * Enables offline play and background sync
 */

const CACHE_NAME = 'voice-runner-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/storage.js',
    '/js/phrases.js',
    '/js/audio.js',
    '/js/game.js',
    '/js/app.js',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Cache external assets separately (don't fail install if they fail)
                return caches.open(CACHE_NAME).then((cache) => {
                    return Promise.allSettled(
                        EXTERNAL_ASSETS.map(url => 
                            cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url))
                        )
                    );
                });
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip API requests (handle separately)
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response, but also update cache in background
                    fetchAndCache(request);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetchAndCache(request);
            })
            .catch(() => {
                // If both cache and network fail, return offline page for navigation
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                
                // Return error for other requests
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            })
    );
});

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Network error - try cache again as last resort
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * Background sync event - upload pending data
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
    
    if (event.tag === 'upload-recordings') {
        event.waitUntil(syncRecordings());
    }
});

/**
 * Sync recordings to server
 */
async function syncRecordings() {
    console.log('[SW] Syncing recordings...');
    
    // This would be handled by the main app's Storage module
    // The service worker just triggers the sync
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
        client.postMessage({
            type: 'SYNC_RECORDINGS'
        });
    }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'New update available!',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Voice Runner', options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' })
            .then((clients) => {
                // Focus existing window if available
                for (const client of clients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url);
                }
            })
    );
});

/**
 * Message event - handle commands from main app
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            if (data?.urls) {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.addAll(data.urls);
                });
            }
            break;
            
        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME);
            break;
    }
});

console.log('[SW] Service Worker loaded');
