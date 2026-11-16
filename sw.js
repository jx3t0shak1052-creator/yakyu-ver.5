/* 草野球オーダー作成 v5 ― オフライン用サービスワーカー
   インターネットにつながっているときは最新版を取りに行き、つながらないときは
   前回保存したアプリを表示する（試合会場でWi-Fiがなくても開けるように）。 */
const CACHE = 'kusayakyu-v5';
const CORE = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // スプレッドシートとの通信などは触らない
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(isPage ? './index.html' : req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(isPage ? './index.html' : req, { ignoreSearch: true })
        .then((r) => r || caches.match('./index.html'))
    )
  );
});
