const CACHE_NAME = "english-master-v6";

const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./manifest.json"
];

// cache.addAll() fails (and aborts install) the moment ANY single asset is
// missing (e.g. an icon that hasn't been added yet). We cache each asset
// individually instead, so one missing file can't break offline support
// for everything else.
async function cacheAssetsIndividually(cache) {
  await Promise.all(
    ASSETS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res && res.ok) {
          await cache.put(url, res);
        } else {
          console.warn("⚠️ Service Worker: keshga olinmadi (status):", url);
        }
      } catch (err) {
        console.warn("⚠️ Service Worker: keshga olinmadi (topilmadi):", url);
      }
    })
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: Fayllar keshga olinmoqda...");
        return cacheAssetsIndividually(cache);
      })
      .then(() => self.skipWaiting())
  );
});


self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("🧹 Service Worker: Eski kesh o'chirilmoqda:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener("fetch", (e) => {
  
  if (!e.request.url.startsWith("http")) return;

  
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
     
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        
        console.log("📴 Tarmoq xatosi (Foydalanuvchi oflayn yoki server o'chiq)");
        const cachedResponse = await caches.match(e.request);
        if (cachedResponse) return cachedResponse;

        
        if (e.request.mode === "navigate") {
          const fallbackPage = await caches.match("./index.html");
          if (fallbackPage) return fallbackPage;
        }

       
        return new Response(
          "Siz oflaynsiz va bu fayl keshda mavjud emas.",
          { status: 503, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      })
  );
});