const CACHE_NAME = "english-master-ai-v19";

// Ilovaning o'z fayllari — bular bo'lmasa ilova umuman ochilmaydi.
const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./theme-refresh.css",
  "./index.js",
  "./pro-admin.js",
  "./pro-payment.js",
  "./pro-messenger.js",
  "./manifest.json"
];

// Tashqi CDN resurslari (shriftlar, ikonalar, Chart.js) — internet
// bo'lganda bir marta yuklanib, keyin oflaynda ham ishlashi uchun keshga
// olinadi. Bular ixtiyoriy: yuklanmasa ham ilovaning asosiy qismi ishlayveradi.
const CDN_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js"
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

// CDN resurslarini alohida, "no-cors" rejimida keshlaymiz — chunki ular
// boshqa domendan kelayotgani uchun oddiy fetch() CORS xatosi berishi
// mumkin. "no-cors" bilan kelgan "opaque" javob ham keshda saqlanadi va
// oflaynda qayta ishlatilaveradi (faqat JS uni o'qib bo'lmaydi, lekin
// brauzer uni to'g'ridan-to'g'ri ko'rsata oladi).
async function cacheCdnAssets(cache) {
  await Promise.all(
    CDN_ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { mode: "no-cors" });
        await cache.put(url, res);
      } catch (err) {
        console.warn("⚠️ Service Worker: CDN fayl keshga olinmadi:", url);
      }
    })
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log("📦 Service Worker: Fayllar keshga olinmoqda...");
        await cacheAssetsIndividually(cache);
        await cacheCdnAssets(cache);
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

  const url = new URL(e.request.url);
  const isOwnStaticAsset = url.origin === self.location.origin &&
    ASSETS.some((a) => url.pathname.endsWith(a.replace("./", "/")) || (a === "./" && url.pathname === "/"));

  // O'z statik fayllarimiz uchun: avval keshdan darhol javob beramiz
  // (tezroq va oflaynda 100% ishonchli), fon rejimida esa tarmoqdan
  // yangilanishini tekshirib, keshni yangilaymiz (stale-while-revalidate).
  if (isOwnStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const networkFetch = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cacheCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
            }
            return networkResponse;
          })
          .catch(() => null);
        return cached || networkFetch || new Response(
          "Siz oflaynsiz va bu fayl keshda mavjud emas.",
          { status: 503, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      })
    );
    return;
  }

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