/* 復習キュー — 本体だけを持っておく。
   取り込み元のデータは毎回その場で読むので、ここでは触らない。 */
const CACHE = "revq-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icon.svg", "./favicon.png", "./icon-180.png"];
const BASE = new URL("./", self.location).pathname;   // 置き場所が変わっても効くように

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  /* 瞬間英作文の収録データは向こうの持ちもの。古い写しを掴まないよう素通しにする */
  if (url.pathname.indexOf("/sunkan-333/") >= 0) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && url.pathname.indexOf(BASE) === 0) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
  );
});
