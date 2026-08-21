/// <reference lib="webworker" />

declare const __VERSION__: string;
declare const __PRECACHE_URLS__: string[];
declare const __STATIC_EXT_REGEX__: string;
declare const __RUNTIME_EXT_REGEX__: string;
declare const __CONTENT_UPDATED__: string;

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
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== VERSION)
          .map((key) => caches.delete(key)),
      );
      await SW.clients.claim();
    }),
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
    const resultingClientId = event.resultingClientId;
    const fetched = fetch(event.request.url, { cache: 'no-store' }).then(async (response) => {
      const cache = await caches.open(VERSION);
      await cache.put(event.request, response.clone());
      return response;
    });

    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        if (cached) {
          event.waitUntil(
            fetched.then(async (fresh) => {
              const [cachedText, freshText] = await Promise.all([
                cached.clone().text(),
                fresh.clone().text(),
              ]);
              if (cachedText !== freshText) {
                const clients = await SW.clients.matchAll({
                  type: 'window',
                  includeUncontrolled: true,
                });
                clients.forEach((client) =>
                  client.postMessage(__CONTENT_UPDATED__),
                );

                if (
                  resultingClientId
                  && !clients.some((client) => client.id === resultingClientId)
                ) {
                  const resultingClient = await SW.clients.get(resultingClientId);
                  resultingClient?.postMessage(__CONTENT_UPDATED__);
                }
              }
            }),
          );
          return cached;
        }
        return fetched;
      }),
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached ?? fetch(event.request)),
  );
});
