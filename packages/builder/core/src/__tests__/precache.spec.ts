import { webcrypto } from 'crypto';
import { fileURLToPath } from 'url';
import { runInNewContext } from 'vm';
import { describe, expect, it } from '@blog/test-toolkit';
import { buildSync } from 'esbuild';
import { cacheNames, metadata, messages, policy } from '../plugins/precache/policy';
import { htmlResources } from '../plugins/precache/resources';

const source = buildSync({
  entryPoints: [fileURLToPath(new URL('../plugins/precache/sw.ts', import.meta.url))],
  bundle: true, write: false, platform: 'browser', format: 'iife',
}).outputFiles[0].text;
const origin = 'https://blog.test';
const url = `${origin}/post/`;
const asset = (name: string) => `${origin}/${name}`;
const document = (version: string, extra = '') => `<link rel="stylesheet" href="/${version}.css"><script src="/${version}.js"></script>${extra}<p>${version}</p>`;
const html = (text: string) => new Response(text, { headers: { 'content-type': 'text/html' } });

function setup() {
  const listeners = new Map<string, (event: any) => void>();
  const stores = new Map<string, Map<string, Response>>();
  const notices: { id: string; data: any }[] = [];
  const warnings: unknown[] = [];
  const requests: string[] = [];
  const clients = new Map<string, { id: string; url: string; postMessage: (data: any) => void }>();
  let network = async (value: string): Promise<Response> => value === url ? html(document('a')) : new Response('asset');
  let now = Date.now();
  let rejectWrites = false;
  const key = (request: string | { url: string }) => typeof request === 'string' ? request : request.url;
  const cacheApi = {
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name)!;
      return {
        keys: async () => [...entries.keys()].map((value) => new Request(value)),
        match: async (request: string | { url: string }) => entries.get(key(request))?.clone(),
        put: async (request: string | { url: string }, response: Response) => {
          if (rejectWrites) throw new Error('quota exceeded');
          entries.set(key(request), response.clone());
        },
        delete: async (request: string | { url: string }) => entries.delete(key(request)),
      };
    },
  };
  function boot() {
    listeners.clear();
    runInNewContext(source, {
      URL, Request, Response, Headers, TextEncoder, Uint8Array, crypto: webcrypto,
      Date: class extends Date {
        static now() {
          return now;
        }
      },
      console: { warn: (...args: unknown[]) => warnings.push(args) },
      caches: cacheApi,
      fetch: (request: string | { url: string }) => {
        requests.push(key(request));
        return network(key(request));
      },
      self: {
        location: { origin },
        addEventListener: (name: string, listener: (event: any) => void) =>
          listeners.set(name, listener),
        clients: { matchAll: async () => [...clients.values()] },
      },
    });
  }
  function client(id: string, page = url) {
    const value = { id, url: page, postMessage: (data: any) => notices.push({ id, data }) };
    clients.set(id, value);
    return value;
  }
  function dispatch(name: string, values: Record<string, unknown> = {}) {
    const tasks: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    listeners.get(name)?.({
      waitUntil: (task: Promise<unknown>) => tasks.push(task),
      respondWith: (task: Promise<Response>) => {
        response = task;
      },
      ...values,
    });
    return { response, done: () => Promise.all(tasks) };
  }
  function navigate(id = 'page', page = url) {
    client(id, page);
    return dispatch('fetch', {
      resultingClientId: id,
      request: { url: page, mode: 'navigate', method: 'GET', headers: new Headers() },
    });
  }
  async function visit(id = 'page', page = url) {
    const event = navigate(id, page);
    const text = await (await event.response!).text();
    await event.done();
    return text;
  }
  boot();
  return {
    stores, notices, warnings, requests, clients, client, dispatch, navigate, visit, boot,
    setNetwork: (fn: typeof network) => {
      network = fn;
    },
    advance: (ms: number) => {
      now += ms;
    },
    rejectWrites: () => {
      rejectWrites = true;
    },
    read: async (name: string, page = url) => stores.get(name)?.get(page)?.clone().text(),
    ready(id: string, refs: string[]) {
      return dispatch('message', { source: clients.get(id), data: { type: messages.ready, url: clients.get(id)!.url, resources: refs } });
    },
    fetch(path: string, options: Record<string, unknown> = {}) {
      return dispatch('fetch', { request: { url: asset(path), method: 'GET', headers: new Headers(), ...options } });
    },
  };
}

describe('HTML 直接资源声明', () => {
  it('只识别同源声明、合并重复链接，跳过注释、内联代码、正文图与媒体', () => {
    const text = `<!-- <script src="/wrong.js"></script> -->
      <script>const str = '<link rel="stylesheet" href="/wrong.css">';</script>
      <style>.x:after {content:'<link rel="icon" href="/wrong.ico">'}</style>
      <LINK REL=stylesheet HREF="/a.css?x=1&amp;y=2"><script src='/a.js'></script>
      <link rel=modulepreload href=/a.js><link rel=preload as=font href=/font.woff2>
      <link rel="shortcut icon" href=/favicon.ico><link rel=preload as=image href=/hero.webp>
      <link rel=canonical href=/other/><link rel=preconnect href=https://other.test>
      <link rel=stylesheet href=https://other.test/x.css><img src=/body.png>
      <link rel=preload as=video href=/movie.mp4>`;
    expect(htmlResources(text, url)).deep.eq([
      asset('a.css?x=1&y=2'), asset('a.js'), asset('font.woff2'), asset('favicon.ico'), asset('hero.webp'),
    ]);
  });
});

describe('页面和资源一起更新', () => {
  it('缓存写入被浏览器拒绝时，页面和图片仍能从网络正常加载', async () => {
    const sw = setup();
    sw.rejectWrites();
    expect(await sw.visit()).eq(document('a'));
    const event = sw.fetch('image.png');
    expect(await (await event.response!).text()).eq('asset');
    await event.done();
  });

  it('导航到重定向地址时返回重定向，不缓存目标内容到原地址', async () => {
    const sw = setup();
    const response = html(document('a'));
    Object.defineProperties(response, {
      redirected: { value: true }, url: { value: `${origin}/destination/` },
    });
    sw.setNetwork(async () => response);
    const event = sw.navigate();
    const result = await event.response!;
    expect(result.status).eq(302);
    expect(result.headers.get('location')).eq(`${origin}/destination/`);
    await event.done();
    expect(await sw.read(cacheNames.html)).eq(undefined);
  });

  it('同时打开两个页面只下载一次共享文件，两个页面都完整保存', async () => {
    const sw = setup();
    sw.setNetwork(async (value) => value.endsWith('/') ? html(document('a')) : new Response('asset'));
    await Promise.all([sw.visit('first'), sw.visit('second', `${origin}/second/`)]);
    expect(sw.requests.filter((value) => value === asset('a.css'))).to.have.length(1);
    expect(sw.stores.get(cacheNames.html)!.size).eq(2);
  });

  it('首次只保存访问的页面及其声明，不抓取正文图片或全站页面；不变时不刷新、不下载文件', async () => {
    const sw = setup();
    sw.setNetwork(async (value) => value === url ? html(document('a', '<img src="/body.jpg">')) : new Response('asset'));
    await sw.visit();
    expect(sw.requests.sort()).deep.eq([
      url, asset('a.css'), asset('a.js'),
    ].sort());
    sw.requests.length = 0;
    await sw.visit('next');
    expect(sw.requests).deep.eq([url]);
    expect(sw.notices).deep.eq([]);
  });

  it('先显示完整旧页，新资源全部就绪才保存新页；只通知同一文章，存活旧页继续持有旧文件', async () => {
    const sw = setup();
    await sw.visit('old');
    await sw.ready('old', [asset('a.css'), asset('a.js')]).done();
    const other = `${origin}/other/`;
    sw.setNetwork(async (value) => value === other ? html(document('a')) : new Response('asset'));
    await sw.visit('other', other);
    let release!: (response: Response) => void;
    const stalled = new Promise<Response>((resolve) => {
      release = resolve;
    });
    sw.setNetwork(async (value) => value === url ? html(document('b')) : value === asset('b.js') ? stalled : new Response('new'));
    const event = sw.navigate('new');
    expect(await (await event.response!).text()).eq(document('a'));
    expect(await sw.read(cacheNames.html)).eq(document('a'));
    expect(sw.notices).deep.eq([]);
    release(new Response('new script'));
    await event.done();
    expect(await sw.read(cacheNames.html)).eq(document('b'));
    expect(sw.notices.map(({ id }) => id).sort()).deep.eq(['new', 'old']);
    expect([...sw.stores.get(cacheNames.static)!.keys()]).include(asset('a.css'));
    // 重启 worker 后仍能正确保留旧文档与共享页面的引用。
    sw.boot();
    await sw.dispatch('activate').done();
    expect([...sw.stores.get(cacheNames.static)!.keys()]).include(asset('a.js'));
  });

  it('新字体失败不替换 HTML，重试成功后更新；无人引用的失败下载会回收', async () => {
    const sw = setup();
    await sw.visit();
    const next = document('b', '<link rel=preload as=font href=/b.woff2>');
    sw.setNetwork(async (value) => value === url ? html(next) : new Response('failed', { status: value.endsWith('woff2') ? 503 : 200 }));
    expect(await sw.visit('retry')).eq(document('a'));
    expect(await sw.read(cacheNames.html)).eq(document('a'));
    expect(sw.notices).deep.eq([]);
    expect([...sw.stores.get(cacheNames.static)!.keys()].sort()).deep.eq([asset('a.css'), asset('a.js')]);
    sw.setNetwork(async (value) => value === url ? html(next) : new Response('ok'));
    await sw.visit('success');
    expect(await sw.read(cacheNames.html)).eq(next);
  });

  it('文字更新复用文件；离线与服务器错误都保留已有页面', async () => {
    const sw = setup();
    await sw.visit();
    sw.requests.length = 0;
    const next = document('a', 'new text');
    sw.setNetwork(async () => html(next));
    await sw.visit('text');
    expect(sw.requests).deep.eq([url]);
    sw.setNetwork(async () => {
      throw new Error('offline');
    });
    expect(await sw.visit('offline')).eq(next);
    sw.setNetwork(async () => new Response('oops', { status: 500 }));
    expect(await sw.visit('error')).eq(next);
    expect(await sw.read(cacheNames.html)).eq(next);
  });

  it('丢失依赖的 HTML 不再返回；404 删除失效页面', async () => {
    const sw = setup();
    await sw.visit();
    sw.stores.get(cacheNames.static)!.delete(asset('a.css'));
    sw.setNetwork(async (value) => value === url ? html(document('b')) : new Response('ok'));
    expect(await sw.visit('missing')).eq(document('b'));
    sw.setNetwork(async () => new Response('gone', { status: 404 }));
    await sw.visit('gone');
    expect(await sw.read(cacheNames.html)).eq(undefined);
  });

  it('通知早于注册脚本就绪时，页面就绪后补发通知', async () => {
    const sw = setup();
    await sw.visit('old');
    sw.setNetwork(async (value) => value === url ? html(document('b')) : new Response('ok'));
    await sw.visit('loading');
    sw.notices.length = 0;
    await sw.ready('loading', [asset('a.css'), asset('a.js')]).done();
    expect(sw.notices.map(({ id }) => id)).include('loading');
  });

  it('首次未受控页面只预热自己，不触发多余刷新', async () => {
    const sw = setup();
    sw.client('first');
    await sw.ready('first', [asset('a.css'), asset('a.js')]).done();
    expect(await sw.read(cacheNames.html)).eq(document('a'));
    expect(sw.notices).deep.eq([]);
  });
});

describe('回收和运行时缓存', () => {
  it('清理过期页面，保留共享资源，最后一个引用消失才删除；旧格式直接删除', async () => {
    const sw = setup();
    await sw.visit('old');
    sw.clients.clear();
    sw.advance(policy.pageIdleMs + 1);
    const other = `${origin}/shared/`;
    sw.setNetwork(async (value) => value === other ? html(document('a')) : new Response('ok'));
    await sw.visit('shared', other);
    expect(await sw.read(cacheNames.html)).eq(undefined);
    expect([...sw.stores.get(cacheNames.static)!.keys()]).include(asset('a.css'));
    sw.clients.clear();
    sw.advance(policy.pageIdleMs + 1);
    sw.stores.set('blog-html-v1', new Map());
    sw.stores.set('1790000000000', new Map());
    await sw.dispatch('activate').done();
    expect(sw.stores.get(cacheNames.static)!.size).eq(0);
    expect(sw.stores.has('blog-html-v1')).eq(false);
    expect(sw.stores.has('1790000000000')).eq(false);
  });

  it('HTML 超过数量上限淘汰最久未访问的页面', async () => {
    const sw = setup();
    await sw.visit();
    const store = sw.stores.get(cacheNames.html)!;
    const template = store.get(url)!;
    for (let index = 0; index < policy.pageLimit; index += 1) store.set(`${origin}/seed/${index}`, template.clone());
    sw.clients.clear();
    await sw.dispatch('activate').done();
    expect(store.size).eq(policy.pageLimit);
  });

  it('图片按需保存，过期重新取；数量和容量都有上限', async () => {
    const sw = setup();
    await sw.fetch('image.png').done();
    expect(await sw.read(cacheNames.runtime, asset('image.png'))).eq('asset');
    sw.requests.length = 0;
    await sw.fetch('image.png').done();
    expect(sw.requests).deep.eq([]);
    sw.advance(policy.runtimeIdleMs + 1);
    await sw.fetch('image.png').done();
    expect(sw.requests).deep.eq([asset('image.png')]);
    const store = sw.stores.get(cacheNames.runtime)!;
    const template = store.get(asset('image.png'))!;
    for (let index = 0; index < policy.runtimeLimit; index += 1) store.set(asset(`seed-${index}.png`), template.clone());
    await sw.dispatch('activate').done();
    expect(store.size).eq(policy.runtimeLimit);
    store.clear();
    const large = new Response('body', { headers: {
      [metadata.used]: String(Date.now()), [metadata.bytes]: String(policy.runtimeBytes * 0.75),
    } });
    store.set(asset('one.png'), large.clone());
    store.set(asset('two.png'), large.clone());
    await sw.dispatch('activate').done();
    expect(store.size).eq(1);
  });

  it('媒体、分段请求、跨域和非 GET 不接管，失败图片不缓存', async () => {
    const sw = setup();
    for (const event of [
      sw.fetch('movie.mp4'), sw.fetch('sound.mp3'),
      sw.fetch('file', { destination: 'video' }),
      sw.fetch('image.jpg', { headers: new Headers({ range: 'bytes=0-99' }) }),
      sw.fetch('image.jpg', { method: 'POST' }),
      sw.fetch('image.jpg', { url: 'https://elsewhere.test/a.jpg' }),
    ]) expect(event.response).eq(undefined);
    sw.setNetwork(async () => new Response('missing', { status: 404 }));
    await sw.fetch('missing.png').done();
    expect(sw.stores.get(cacheNames.runtime)!.size).eq(0);
  });
});
