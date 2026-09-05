/* 復習キュー — オフラインでも開けるようにする。
   本体を先に取っておき、ネットが無いときはその写しを出す。 */
const CACHE = "fq-v2";
const BASE = new URL("./", self.location).pathname;   // 置き場所が変わっても効く
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
                "./icon-180.png", "./favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
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
  if (url.pathname.indexOf(BASE) !== 0) return;

  /* ネットを先に見る。取れたぶんは写しを更新しておく。
     取れなければ写しを出す。それも無ければ本体を返して、白い画面を避ける。 */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
  );
});
