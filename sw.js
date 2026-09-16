// 電波のない場所でも開けるように、アプリのファイルをスマホに保存しておく。
// ページ本体（index.html）はネットにつながるたびに最新になる。
// アイコンなどほかのファイルを差し替えたときは VERSION の数字を上げる。
const VERSION = "v2";
const CACHE = "jihi-kiroku-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("jihi-kiroku-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    // ネットにつながっていれば最新のページ、つながらなければ保存しておいたページ
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
