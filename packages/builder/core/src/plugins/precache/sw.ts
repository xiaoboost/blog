/// <reference lib="webworker" />

declare const __VERSION__: string;
declare const __PRECACHE_URLS__: string[];
declare const __STATIC_EXT_REGEX__: string;
declare const __RUNTIME_EXT_REGEX__: string;
declare const __CONTENT_UPDATED__: string;

const VERSION = __VERSION__;
// HTML 在发布新构建后仍用于缓存优先展示，不随静态资源版本清理。
const HTML_CACHE = 'blog-html-v1';
const PRECACHE_URLS: string[] = __PRECACHE_URLS__;
const STATIC_EXT_REGEX = new RegExp(__STATIC_EXT_REGEX__);
const RUNTIME_EXT_REGEX = new RegExp(__RUNTIME_EXT_REGEX__);

/** DOM lib shadows ServiceWorkerGlobalScope; explicit cast to get SW type */
const SW = self as unknown as ServiceWorkerGlobalScope;

SW.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const oldKey = keys.find((key) => key !== VERSION && key !== HTML_CACHE);
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
          .filter((key) => key !== VERSION && key !== HTML_CACHE)
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
    const cached = caches.open(HTML_CACHE).then(async (cache) => {
      const response = await cache.match(event.request);
      // respondWith 会消费响应体，必须在交给页面之前保留比较副本。
      return { cache, response, comparison: response?.clone() };
    });
    const fetched = cached.then(async ({ cache }) => {
      // 先取得旧缓存快照，再发起可能覆盖缓存的后台请求。
      const response = await fetch(event.request.url, { cache: 'no-store' });
      if (response.ok) {
        await cache.put(event.request, response.clone());
      }
      return response;
    });

    event.respondWith(
      cached.then(({ response }) => response ?? fetched),
    );
    event.waitUntil(
      Promise.all([cached, fetched]).then(async ([{ comparison }, fresh]) => {
        if (!comparison || !fresh.ok) {
          return;
        }
        const [cachedText, freshText] = await Promise.all([
          comparison.text(),
          fresh.text(),
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
      }).catch((error) => {
        console.warn('[precache] HTML update failed', error);
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
