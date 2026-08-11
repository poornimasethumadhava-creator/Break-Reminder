const CACHE_NAME = 'break-reminder-v3';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(names =>
        Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(resp => {
                if (resp.status === 200) {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                }
                return resp;
            }).catch(() => new Response(
                '<h1 style="text-align:center;margin-top:40vh;font-family:sans-serif;">🏢 Break Reminder is offline</h1>',
                { headers: { 'Content-Type': 'text/html' } }
            ));
        })
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('./index.html');
        })
    );
});

self.addEventListener('message', e => {
    if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(e.data.title, {
            body: e.data.body,
            icon: '🏢',
            badge: '🏢',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            tag: 'break-reminder',
            renotify: true
        });
    }
});