import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';
import { describe, expect, it } from '@blog/test-toolkit';
import { transformSync } from 'esbuild';

const source = transformSync(
  readFileSync(new URL('../plugins/precache/sw.ts', import.meta.url), 'utf8'),
  { loader: 'ts' },
).code;
const url = 'https://blog.test/post/';
const htmlCache = 'blog-html-v1';

function setup(initial?: string) {
  const listeners = new Map<string, (event: any) => void>();
  const stores = new Map<string, Map<string, string>>();
  const messages: string[] = [];
  const warnings: unknown[] = [];
  let resolveNetwork!: (response: Response) => void;
  let rejectNetwork!: (error: Error) => void;
  const network = new Promise<Response>((resolve, reject) => {
    resolveNetwork = resolve;
    rejectNetwork = reject;
  });
  if (initial !== undefined) {
    stores.set(htmlCache, new Map([[url, initial]]));
  }
  const clients = ['existing-page', 'new-page'].map((id) => ({
    id,
    postMessage: (message: string) => messages.push(`${id}:${message}`),
  }));
  const cacheApi = {
    keys: async () => [...stores.keys()],
    delete: async (key: string) => stores.delete(key),
    open: async (key: string) => {
      if (!stores.has(key)) {
        stores.set(key, new Map());
      }
      const entries = stores.get(key)!;
      return {
        match: async (request: { url: string }) => {
          const text = entries.get(request.url);
          return text === undefined ? undefined : new Response(text);
        },
        put: async (request: { url: string }, response: Response) => {
          entries.set(request.url, await response.text());
        },
      };
    },
  };
  runInNewContext(source, {
    __VERSION__: 'new-build',
    __PRECACHE_URLS__: [],
    __STATIC_EXT_REGEX__: '\\.(?:js|css)$',
    __RUNTIME_EXT_REGEX__: '\\.(?:png|jpg)$',
    __CONTENT_UPDATED__: 'content-updated',
    URL,
    console: { warn: (...args: unknown[]) => warnings.push(args) },
    caches: cacheApi,
    fetch: () => network,
    self: {
      addEventListener: (name: string, listener: (event: any) => void) =>
        listeners.set(name, listener),
      skipWaiting: async () => {},
      clients: {
        claim: async () => {},
        matchAll: async () => [clients[0]],
        get: async () => clients[1],
      },
    },
  });
  return {
    stores, messages, warnings, resolveNetwork, rejectNetwork,
    dispatch(name = 'fetch') {
      const tasks: Promise<unknown>[] = [];
      let response!: Promise<Response>;
      listeners.get(name)!({
        request: { url, mode: 'navigate' },
        resultingClientId: 'new-page',
        waitUntil: (task: Promise<unknown>) => tasks.push(task),
        respondWith: (task: Promise<Response>) => {
          response = task;
        },
      });
      // waitUntil 必须在事件分发期间注册，而不是在网络回调中才注册。
      expect(tasks).to.have.length(1);
      return { response, done: () => Promise.all(tasks) };
    },
  };
}

describe('precache HTML 更新', () => {
  it('先消费旧 HTML，网络返回后仍能比较，并通知现有及新页面', async () => {
    const sw = setup('old');
    const event = sw.dispatch();
    expect(await (await event.response).text()).eq('old');
    expect(sw.messages).deep.eq([]);
    sw.resolveNetwork(new Response('new'));
    await event.done();
    expect(sw.stores.get(htmlCache)?.get(url)).eq('new');
    expect(sw.messages).deep.eq(['existing-page:content-updated', 'new-page:content-updated']);
    expect(sw.warnings).deep.eq([]);
  });

  it('HTML 不变时不通知', async () => {
    const sw = setup('same');
    const event = sw.dispatch();
    await (await event.response).text();
    sw.resolveNetwork(new Response('same'));
    await event.done();
    expect(sw.messages).deep.eq([]);
    expect(sw.warnings).deep.eq([]);
  });

  it('首次访问等待网络并缓存，不广播刷新', async () => {
    const sw = setup();
    const event = sw.dispatch();
    sw.resolveNetwork(new Response('first'));
    expect(await (await event.response).text()).eq('first');
    await event.done();
    expect(sw.stores.get(htmlCache)?.get(url)).eq('first');
    expect(sw.messages).deep.eq([]);
  });

  it('网络失败仍返回旧页面，后台拒绝已处理', async () => {
    const sw = setup('old');
    const event = sw.dispatch();
    expect(await (await event.response).text()).eq('old');
    sw.rejectNetwork(new Error('offline'));
    await event.done();
    expect(sw.stores.get(htmlCache)?.get(url)).eq('old');
    expect(sw.messages).deep.eq([]);
    expect(sw.warnings).to.have.length(1);
  });

  it('HTTP 错误不覆盖正常 HTML，也不广播刷新', async () => {
    const sw = setup('old');
    const event = sw.dispatch();
    await (await event.response).text();
    sw.resolveNetwork(new Response('server error', { status: 500 }));
    await event.done();
    expect(sw.stores.get(htmlCache)?.get(url)).eq('old');
    expect(sw.messages).deep.eq([]);
  });

  it('新 SW 安装、激活只清理旧版本缓存，保留 HTML', async () => {
    const sw = setup('old');
    sw.stores.set('old-build', new Map());
    await sw.dispatch('install').done();
    await sw.dispatch('activate').done();
    expect([...sw.stores.keys()]).deep.eq([htmlCache, 'new-build']);
    expect(sw.stores.get(htmlCache)?.get(url)).eq('old');
  });
});
