/// <reference lib="webworker" />

declare const __VERSION__: string;
declare const __PRECACHE_URLS__: string[];
declare const __STATIC_EXT_REGEX__: string;
declare const __RUNTIME_EXT_REGEX__: string;

const VERSION = __VERSION__;
const PRECACHE_URLS: string[] = __PRECACHE_URLS__;
const STATIC_EXT_REGEX = new RegExp(__STATIC_EXT_REGEX__);
const RUNTIME_EXT_REGEX = new RegExp(__RUNTIME_EXT_REGEX__);

/** DOM lib shadows ServiceWorkerGlobalScope; explicit cast to get SW type */
const SW = self as unknown as ServiceWorkerGlobalScope;

SW.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const oldKey = keys.find((key) => key !== VERSION);
      const oldCache = oldKey ? await caches.open(oldKey) : null;
      const newCache = await caches.open(VERSION);

      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          const cached = oldCache ? await oldCache.match(url) : undefined;
          if (cached) {
            await newCache.put(url, cached);
            return;
          }
          const response = await fetch(url);
          await newCache.put(url, response);
        }),
      );
    }),
  );
  SW.skipWaiting();
});

SW.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== VERSION)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

SW.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url);

  if (STATIC_EXT_REGEX.test(pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request),
      ),
    );
    return;
  }

  if (RUNTIME_EXT_REGEX.test(pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached ?? fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, clone));
          return response;
        });
      }),
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    const fetched = fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(VERSION).then((cache) => cache.put(event.request, clone));
      return response;
    });

    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached ?? fetched),
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached ?? fetch(event.request)),
  );
});
