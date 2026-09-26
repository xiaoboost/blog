/// <reference lib="webworker" />

import { cacheNames, metadata, messages, policy } from './policy';
import { htmlResources, isMedia, isRuntime, localResource, pageUrl } from './resources';
import { cleanRuntime, decorate, metaUrl, readClient, readPage, revisionOf, saveClient, type ClientInfo } from './storage';

const SW = self as unknown as ServiceWorkerGlobalScope;
// 新 HTML 尚未提交时，已下载的文件也有临时引用，避免被其他页面的清理删掉。
const pending = new Map<string, string[]>();
// 不同页面或浏览器自身同时请求同一文件时，共用下载任务。
const downloads = new Map<string, Promise<Response>>();
let transaction: Promise<unknown> = Promise.resolve();

/** 串行处理缓存记录的修改和清理；网络下载放在外面，避免阻塞其他页面命中缓存。 */
function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const result = transaction.then(work);
  transaction = result.catch(() => undefined);
  return result;
}

function report(error: unknown) {
  console.warn('[precache]', error);
}

/** 从页面、仍打开的文档及正在准备的页面重新合并引用，不维护易失配的计数。 */
async function collect(force = false): Promise<void> {
  const html = await caches.open(cacheNames.html);
  const meta = await caches.open(cacheNames.meta);
  const sweepKey = metaUrl('sweep');
  const lastSweep = Number(await (await meta.match(sweepKey))?.text());
  // 日常访问最多每天做一次全量过期检查；激活时强制检查，引用清理则每次都做。
  const sweep = force || !lastSweep || Date.now() - lastSweep > policy.sweepIntervalMs;
  const pages = await Promise.all((await html.keys()).map(async (request) => ({
    request,
    info: readPage((await html.match(request))!),
  })));
  pages.sort((a, b) => (b.info?.used ?? 0) - (a.info?.used ?? 0));
  const refs = new Set<string>();
  for (const [index, page] of pages.entries()) {
    if (
      !page.info
      || index >= policy.pageLimit
      || (sweep && Date.now() - page.info.used > policy.pageIdleMs)
    ) {
      await html.delete(page.request);
    }
    else {
      page.info.resources.forEach((url) => refs.add(url));
    }
  }

  const clients = await SW.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const live = new Set(clients.map((client) => client.id));
  for (const request of await meta.keys()) {
    if (!request.url.startsWith(metaUrl('client/'))) continue;
    const info: ClientInfo = await (await meta.match(request))!.json();
    const id = request.url.slice(metaUrl('client/').length);
    // resultingClientId 在页面开始加载时可能暂时还不出现在 matchAll 中。
    if (live.has(id) || (!info.confirmed && Date.now() - info.used < 60_000)) {
      info.resources.forEach((url) => refs.add(url));
    }
    else {
      // 已关闭文档的引用随下一次访问或更新回收，无须监听每个窗口的关闭事件。
      await meta.delete(request);
    }
  }
  for (const resources of pending.values()) resources.forEach((url) => refs.add(url));
  const assets = await caches.open(cacheNames.static);
  // 只做本地集合比对，不请求其他文章，也不维护需要反复加减的持久化引用计数。
  for (const request of await assets.keys()) {
    if (!refs.has(request.url)) await assets.delete(request);
  }
  if (sweep) {
    await cleanRuntime();
    await meta.put(sweepKey, new Response(String(Date.now())));
  }
}

function download(url: string): Promise<Response> {
  let task = downloads.get(url);
  if (!task) {
    task = (async () => {
      const assets = await caches.open(cacheNames.static);
      const cached = await assets.match(url);
      // 依赖构建生成的内容哈希 URL：同一地址代表同一文件，不在该地址下替换内容。
      if (cached) return cached;
      const response = await (await caches.open(cacheNames.runtime)).match(url) ?? await fetch(url, { cache: 'no-store' });
      if (!response.ok || response.status === 206 || response.type === 'opaque') throw new Error(`Resource unavailable: ${url}`);
      await exclusive(async () => {
        await assets.put(url, response.clone());
        // 已按需缓存的文件被 HTML 直接引用后，转为按引用保留，避免保存两份。
        await (await caches.open(cacheNames.runtime)).delete(url);
      });
      return response;
    })();
    downloads.set(url, task);
    void task.finally(() => downloads.delete(url)).catch(() => undefined);
  }
  return task.then((response) => response.clone());
}

interface FreshPage {
  response: Response;
  text?: string;
  revision?: string;
  resources: string[];
}
interface Update {
  /** 取得 HTML 后即可响应首次访问，不必阻塞到所有资源缓存完成。 */
  loaded: Promise<FreshPage>;
  /** 后台准备资源、提交 HTML、通知页面及回收的完整任务。 */
  done: Promise<void>;
}
// 同一页面同时打开多个窗口时，共用一次后台检查。
const updates = new Map<string, Update>();

async function notify(url: string, revision: string) {
  for (const client of await SW.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
    const info = await readClient(client.id);
    // 只刷新正在显示这篇文章且内容不同的窗口；首次未受控页面不额外刷新。
    if (info?.url === url && info.revision !== null && info.revision !== revision) {
      client.postMessage({ type: messages.updated, url, revision });
    }
  }
}

function update(url: string): Update {
  const existing = updates.get(url);
  if (existing) return existing;
  const loaded = (async (): Promise<FreshPage> => {
    // 访问哪个 URL 就检查哪个 HTML；绕过 HTTP 缓存，更新不依赖新 SW 的发布。
    const response = await fetch(url, { cache: 'no-store' });
    if (response.status !== 200 || response.redirected || !response.headers.get('content-type')?.includes('text/html')) {
      return { response, resources: [] };
    }
    const text = await response.clone().text();
    const resources = htmlResources(text, url);
    const revision = await revisionOf(text);
    await exclusive(async () => {
      pending.set(url, resources);
    });
    return { response, text, resources, revision };
  })();
  const done = (async () => {
    try {
      const fresh = await loaded;
      if (fresh.text === undefined || !fresh.revision) {
        // 已删除的页面不能永久停留在旧缓存中；暂时的服务错误则保留旧页。
        if ([404, 410].includes(fresh.response.status) || fresh.response.redirected) {
          await exclusive(async () => {
            await (await caches.open(cacheNames.html)).delete(url);
          });
          await notify(url, 'removed');
        }
        return;
      }
      // 即便一个文件失败，也等其他下载结束再释放临时引用，避免清理与下载交错。
      const results = await Promise.allSettled(fresh.resources.map(download));
      const failed = results.find((result) => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
      // 所有声明文件都准备好才替换 HTML；失败时旧页保持完整，下次访问再尝试。
      await exclusive(async () => {
        const html = await caches.open(cacheNames.html);
        await html.put(url, decorate(fresh.response.clone(), {
          [metadata.resources]: encodeURIComponent(JSON.stringify(fresh.resources)),
          [metadata.revision]: fresh.revision!,
          [metadata.used]: String(Date.now()),
        }, fresh.text));
      });
      await notify(url, fresh.revision);
    }
    finally {
      await exclusive(async () => {
        pending.delete(url);
        await collect();
      });
    }
  })();
  const task = { loaded, done };
  updates.set(url, task);
  void done.finally(() => updates.delete(url)).catch(() => undefined);
  return task;
}

async function cachedPage(url: string, clientId: string): Promise<Response | undefined> {
  return exclusive(async () => {
    const html = await caches.open(cacheNames.html);
    const response = await html.match(url);
    const info = response && readPage(response);
    if (!response || !info || Date.now() - info.used > policy.pageIdleMs) {
      await html.delete(url);
      return undefined;
    }
    const assets = await caches.open(cacheNames.static);
    // 浏览器可能单独移除了缓存文件，缺少依赖时不能返回会失去样式的旧 HTML。
    const dependencies = await Promise.all(
      info.resources.map((resource) => assets.match(resource)),
    );
    if (!dependencies.every(Boolean)) {
      await html.delete(url);
      return undefined;
    }
    const used = Date.now();
    // 在返回响应前保存旧文档的引用，即使后台马上换成新 HTML，旧资源也还在。
    await saveClient(clientId, { url, ...info, used, confirmed: false });
    await html.put(url, decorate(response.clone(), { [metadata.used]: String(used) }));
    return response;
  });
}

function navigate(event: FetchEvent) {
  const url = pageUrl(event.request.url);
  // 先固定旧页面引用，再允许后台提交新页面。
  const cached = cachedPage(url, event.resultingClientId).catch((error) => {
    report(error);
    return undefined;
  });
  const task = cached.then(() => update(url));
  const displayed = (async () => {
    const response = await cached;
    // 已有完整缓存就立即显示，后台检查通过 waitUntil 独立完成。
    if (response) return response;
    const fresh = await (await task).loaded;
    if (fresh.revision) {
      await exclusive(() => saveClient(event.resultingClientId, {
        url,
        revision: fresh.revision!,
        resources: fresh.resources,
        used: Date.now(),
        confirmed: false,
      })).catch(report);
    }
    // 导航请求的 redirect 模式是 manual，不能直接返回 fetch 跟随重定向后的响应。
    return fresh.response.redirected
      ? Response.redirect(fresh.response.url, 302)
      : fresh.response.clone();
  })();
  event.respondWith(displayed);
  event.waitUntil(Promise.all([displayed, task.then((value) => value.done)]).catch(report));
}

async function resource(request: Request): Promise<Response> {
  const url = pageUrl(request.url);
  const assets = await caches.open(cacheNames.static);
  const cached = await assets.match(url);
  if (cached) return cached;
  if (downloads.has(url)) {
    return downloads.get(url)!
      .then((response) => response.clone())
      .catch(() => fetch(request));
  }
  if ([...pending.values()].some((refs) => refs.includes(url))) {
    return download(url).catch(() => fetch(request));
  }
  if (!isRuntime(request)) return fetch(request);

  const runtime = await caches.open(cacheNames.runtime);
  const existing = await exclusive(async () => {
    const response = await runtime.match(url);
    if (!response) return undefined;
    if (Date.now() - Number(response.headers.get(metadata.used)) > policy.runtimeIdleMs) {
      await runtime.delete(url);
      return undefined;
    }
    await runtime.put(url, decorate(response.clone(), { [metadata.used]: String(Date.now()) }));
    return response;
  });
  if (existing) return existing;
  const response = await fetch(request);
  if (!response.ok || response.status === 206 || response.type === 'opaque') return response;
  const body = await response.clone().arrayBuffer();
  // 超大文件照常返回给页面，但不占用运行时缓存的全部额度。
  if (body.byteLength <= policy.runtimeBytes) {
    await exclusive(async () => {
      // 等待网络期间可能已被页面提升为直接引用的静态资源。
      if (await assets.match(url)) return;
      await runtime.put(url, decorate(response.clone(), {
        [metadata.used]: String(Date.now()), [metadata.bytes]: String(body.byteLength),
      }, body));
      await cleanRuntime();
    }).catch(report);
  }
  return response;
}

SW.addEventListener('activate', (event) => {
  // 不调用 skipWaiting / clients.claim，等待旧 SW 的窗口退出后再接管和清理。
  event.waitUntil(exclusive(async () => {
    const supported: string[] = Object.values(cacheNames);
    // 旧格式直接回收，不迁移按构建版本分组的旧记录。
    for (const name of await caches.keys()) {
      if (!supported.includes(name)) await caches.delete(name);
    }
    await collect(true);
  }));
});

SW.addEventListener('fetch', (event) => {
  const request = event.request;
  // 音视频、Range、跨域及非 GET 不接管，保留浏览器原有的加载行为。
  if (request.method !== 'GET' || new URL(request.url).origin !== SW.location.origin || isMedia(request)) return;
  if (request.mode === 'navigate') {
    navigate(event);
  }
  else {
    // 浏览器拒绝缓存写入（例如空间不足）不能让正常网络请求也失败。
    const response = resource(request).catch(() => fetch(request));
    event.respondWith(response);
    event.waitUntil(response.then(() => undefined).catch(report));
  }
});

SW.addEventListener('message', (event) => {
  if (event.data?.type !== messages.ready || !event.source || !('id' in event.source)) return;
  const client = event.source as Client;
  const url = pageUrl(client.url);
  if (event.data.url !== url || !Array.isArray(event.data.resources)) return;
  const resources = event.data.resources.filter((value: unknown): value is string =>
    typeof value === 'string' && localResource(value, url) === value);
  event.waitUntil((async () => {
    const known = await exclusive(async () => {
      const previous = await readClient(client.id);
      await saveClient(client.id, {
        url, resources, revision: previous?.url === url ? previous.revision : null,
        used: Date.now(), confirmed: true,
      });
      await collect();
      return previous?.url === url;
    });
    if (!known) {
      // 首次安装时页面尚未受控，只预热当前页，避免抓取全站。
      await update(url).done;
    }
    else {
      // 更新可能早于页面注册消息监听器；就绪后再比对一次，补发遗漏的刷新通知。
      const current = await (await caches.open(cacheNames.html)).match(url);
      const info = current && readPage(current);
      if (info) await notify(url, info.revision);
    }
  })().catch(report));
});
