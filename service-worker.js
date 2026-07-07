const CACHE_NAME = "english-master-v2"; // Versiya yangilandi

const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./manifest.json",
  "./icon-192.png"
]; 

// --- Install Event ---
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: Fayllar keshga olinmoqda...");
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) 
  );
});

// --- Activate Event ---
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

// --- Fetch Event (Tuzatilgan qism) ---
self.addEventListener("fetch", (e) => {
  // Faqat HTTP/HTTPS so'rovlarni keshga tekshiramiz (chrome-extension va h.k. xatolik bermasligi uchun)
  if (!e.request.url.startsWith("http")) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      
      // Orqafonda tarmoqdan yangi faylni yuklab olish so'rovi
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log("📴 Tarmoq xatosi (Foydalanuvchi offlayn yoki server o'chiq)");
        });

      // MUHIM TUZATISH: Agar keshda eski fayl bo'lsa ham, agar internet bo'lsa 
      // yangi faylni (fetchPromise) ustun qo'yamiz. Internet yo'q bo'lsagina keshdagini beradi.
      return fetchPromise || cachedResponse;
    })
  );
});