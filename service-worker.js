const CACHE_NAME = "english-master-v1";


const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./manifest.json",
  "./icon-192.png"
]; 


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

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      
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
          console.log("📴 Tarmoq xatosi (Foydalanuvchi offlayn bo'lishi mumkin)");
        });

      
      return cachedResponse || fetchPromise;
    })
  );
});