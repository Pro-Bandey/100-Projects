
// ____________CONFIG

const CACHE_VERSION = "v1";
const CACHE_PREFIX = "100-projects";

const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const MAX_CACHE_ITEMS = 100;

// ____________PATHS

const BASE_PATH = new URL("./", self.location.href).pathname;

const OFFLINE_URL = `${BASE_PATH}offline.html`;
const CORE_ASSETS = [
    OFFLINE_URL,
    `${BASE_PATH}`,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}css/index.css`,
    `${BASE_PATH}js/index.js`,
    `${BASE_PATH}favicon.ico`,
    `${BASE_PATH}manifest.webmanifest`,
    `${BASE_PATH}src/social-.png`,
    `${BASE_PATH}src/social_.png`,
];

// ____________CDN CACHE  (Comment Out If Unused)

// const CDN_CACHE_NAME = `${CACHE_PREFIX}-cdn-${CACHE_VERSION}`;

// const CDN_DOMAINS = [
//     "cdn.jsdelivr.net",
//     "cdnjs.cloudflare.com",
//     "unpkg.com",
//     "fonts.googleapis.com",
//     "fonts.gstatic.com",
// ];


// ____________INSTALL

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil((async () => { const cache = await caches.open(CACHE_NAME); const results = await Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset))); results.forEach((result, index) => { if (result.status === "rejected") { console.warn("[SW] Failed caching:", CORE_ASSETS[index]); } }); })());
});

// ____________ACTIVATE

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
        // CDN CACHE  (Comment Out If Unused)
        // await Promise.all(cacheNames.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME && name !== CDN_CACHE_NAME).map((name) => caches.delete(name))); 
        if ("navigationPreload" in self.registration) { await self.registration.navigationPreload.enable(); }
        await self.clients.claim();
    })());
});

// ____________FETCH

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    // CDN CACHE  (Comment Out If Unused)
    // if (CDN_DOMAINS.includes(url.hostname)) { event.respondWith(cacheCDN(request)); return; }

    if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) { event.respondWith(networkFirst(event)); return; }
    if (["style", "script", "image", "font"].includes(request.destination)) { event.respondWith(staleWhileRevalidate(request)); return; } event.respondWith(networkFirst(event));
});

// ____________NETWORK FIRST

async function networkFirst(event) {
    const request = event.request;
    try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) { return preloadResponse; }
        const response = await fetch(request);
        if (response && response.ok && response.type === "basic") { const cache = await caches.open(CACHE_NAME); cache.put(request, response.clone()); await trimCache(CACHE_NAME, MAX_CACHE_ITEMS); } return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) { return cached; }
        if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) { const offline = await caches.match(OFFLINE_URL); if (offline) { return offline; } }
        return new Response("You are offline", { status: 503, statusText: "Offline", headers: { "Content-Type": "text/plain" } });
    }
}

// ____________STALE WHILE REVALIDATE

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const networkPromise = fetch(request).then(async (response) => { if (response && response.ok) { await cache.put(request, response.clone()); trimCache(CACHE_NAME, MAX_CACHE_ITEMS); } return response; }).catch(() => null);
    if (cached) { return cached; }
    const response = await networkPromise;
    if (response) { return response; }
    return new Response("", { status: 504, statusText: "Gateway Timeout", });
}

// ____________CACHE LIMITER

async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxItems) return;
    while (keys.length > maxItems) { await cache.delete(keys[0]); keys.shift(); }
}

// ____________CDN CACHE HANDLER

async function cacheCDN(request) {
    const cache = await caches.open(CDN_CACHE_NAME);
    const cached = await cache.match(request);
    const networkPromise = fetch(request).then(async (response) => { if (response && response.ok) { await cache.put(request, response.clone()); } return response; }).catch(() => null);
    if (cached) return cached;
    const response = await networkPromise;
    if (response) return response;
    return new Response("", { status: 504, statusText: "Gateway Timeout", });
}