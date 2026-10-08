/* =====================================================================
   SE-ONE.SITE Service Worker
   - อัปเดตทันที: skipWaiting() + clients.claim() (หน้าเว็บจะ reload เองผ่าน controllerchange)
   - HTML (navigation): network-first (timeout 5s) → ออฟไลน์ใช้ App Shell ที่แคชไว้
   - /assets/* (Vite hashed): cache-first (ไฟล์ไม่เปลี่ยนเนื้อหาเมื่อชื่อเดิม)
   - รูป/ฟอนต์: stale-while-revalidate
   - ปล่อยผ่านเครือข่าย: API, Supabase, Analytics, WebSocket, RSS
   ===================================================================== */

const SW_VERSION = '2026.10.08-1'; // แก้เลขนี้เมื่อต้องการบังคับล้างแคช/ให้ SW ตัวใหม่ติดตั้ง
const PREFIX = 'se-one';
const SHELL_CACHE = `${PREFIX}-shell-${SW_VERSION}`;
const ASSET_CACHE = `${PREFIX}-assets`;
const RUNTIME_CACHE = `${PREFIX}-runtime`;

const PRECACHE_URLS = ['/', '/logo.png', '/manifest.webmanifest'];
const NETWORK_ONLY_PATHS = ['/sw.js', '/rss.xml', '/version.json', '/api/', '/ws'];
const MAX_ASSET_ENTRIES = 80;
const MAX_RUNTIME_ENTRIES = 80;
const NAV_TIMEOUT_MS = 5000;

/* ----------------------------- Install ----------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // ใช้ allSettled: ไฟล์ใดไฟล์หนึ่งโหลดไม่ได้ก็ไม่ทำให้การติดตั้งล้มทั้งหมด
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
      await self.skipWaiting(); // อัปเดตทันที ไม่รอให้ปิดทุกแท็บ
    })()
  );
});

/* ----------------------------- Activate ---------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith(`${PREFIX}-`) && !keep.has(n))
          .map((n) => caches.delete(n))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim(); // คุมทุกแท็บทันที → หน้าเว็บได้ controllerchange
    })()
  );
});

/* ------------------------------ Fetch ------------------------------ */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;

  const url = new URL(req.url);

  // หน้า HTML
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate(event));
    return;
  }

  // ฟอนต์ไฟล์จริงของ Google Fonts (CORS, cache ได้ปลอดภัย)
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
    return;
  }

  // ข้ามโดเมนอื่นทั้งหมด (Supabase, GA, GTM, instant.page ฯลฯ)
  if (url.origin !== self.location.origin) return;

  if (NETWORK_ONLY_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p))) return;

  // ไฟล์ build ของ Vite (ชื่อมี hash)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, ASSET_CACHE, MAX_ASSET_ENTRIES));
    return;
  }

  // รูป/ฟอนต์/manifest ในโดเมนเดียวกัน
  if (['image', 'font', 'manifest'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
  }
  // อย่างอื่น: ปล่อยให้เบราว์เซอร์จัดการตามปกติ
});

/* ----------------------------- Messages ---------------------------- */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

/* ---------------------------- Strategies --------------------------- */
async function handleNavigate(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preload = await event.preloadResponse;
    const res =
      preload ||
      (await Promise.race([
        fetch(event.request, { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS)),
      ]));
    if (res && res.ok) {
      event.waitUntil(cache.put('/', res.clone())); // เก็บ App Shell ล่าสุดไว้ใช้ตอนออฟไลน์
    }
    return res;
  } catch (err) {
    const shell = (await cache.match('/')) || (await caches.match('/'));
    if (shell) return shell;
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Offline</title><body style="font-family:system-ui;background:#000;color:#f5f5f7;' +
        'display:grid;place-items:center;height:100vh;margin:0;text-align:center">' +
        '<div><h2>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</h2><p>กรุณาตรวจสอบเครือข่ายแล้วลองใหม่อีกครั้ง</p></div>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (isCacheable(res)) {
    cache.put(req, res.clone());
    trimCache(cacheName, maxEntries);
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (isCacheable(res)) {
        cache.put(req, res.clone());
        trimCache(cacheName, maxEntries);
      }
      return res;
    })
    .catch(() => null);
  return hit || (await network) || Response.error();
}

// ไม่แคชไฟล์ที่ server ตอบ index.html กลับมาแทนไฟล์ที่ไม่พบ (SPA fallback)
function isCacheable(res) {
  if (!res || !res.ok) return false;
  const ct = res.headers.get('content-type') || '';
  return !ct.includes('text/html');
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}