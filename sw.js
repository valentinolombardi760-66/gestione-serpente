// Service worker di SNAKEcheck: memorizza l'app per l'uso offline e mostra i promemoria.
// Cambia VERSION a ogni aggiornamento di index.html per distribuire la nuova versione.
const VERSION = 'snakecheck-v7';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (isFont) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    })));
    return;
  }
  // App: prima la rete per ricevere gli aggiornamenti, cache se offline (anche per gli indirizzi con ?azione=)
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && !url.search) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});

/* ---------- Promemoria ad app chiusa (Chrome/Android con app installata) ---------- */
function readReminders() {
  return new Promise(resolve => {
    const req = indexedDB.open('snakecheck', 1);
    req.onerror = () => resolve(null);
    req.onupgradeneeded = () => { req.transaction.abort(); resolve(null); };
    req.onsuccess = () => {
      const db = req.result;
      try {
        const g = db.transaction('kv').objectStore('kv').get('reminders');
        g.onsuccess = () => { resolve(g.result || null); db.close(); };
        g.onerror = () => { resolve(null); db.close(); };
      } catch (err) { resolve(null); db.close(); }
    };
  });
}
async function remind() {
  const r = await readReminders();
  if (!r || !r.on || !Array.isArray(r.items)) return;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const due = r.items.filter(x => x.date && x.date <= today);
  if (!due.length) return;
  const title = due.length === 1 ? due[0].title : `${due.length} promemoria per oggi`;
  await self.registration.showNotification(title, { body: due.map(x => x.title).join(' · '), tag: 'snakecheck-today', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './index.html#dashboard' } });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'snakecheck-reminders') e.waitUntil(remind()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.includes('index.html') || c.url.endsWith('/'));
    if (open) { open.focus(); return open.navigate ? open.navigate(target).catch(() => {}) : null; }
    return self.clients.openWindow(target);
  }));
});
