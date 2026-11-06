import { rejects, strictEqual, throws } from 'node:assert/strict';
import { BrowserConfigGlobalKey } from '@blog/context/runtime';
import { getScriptExports, setScriptExports, loadResource } from '@blog/context/web';
import { describe, it } from '@blog/test-toolkit';
import { afterEach, beforeEach } from 'mocha';

class Resource {
  src = '';
  href = '';
  rel = '';
  async = true;
  removed = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly tag: string) {}
  remove() {
    this.removed = true;
  }
}

const keys = [
  BrowserConfigGlobalKey,
  'document',
  'addEventListener',
  'removeEventListener',
] as const;
const originals = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
let tags: Resource[];
let currentScript: Resource | null;
const config = { lazyScripts: {} as Record<string, string[]> };
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('公共异步资源加载', () => {
  beforeEach(() => {
    tags = [];
    currentScript = null;
    config.lazyScripts = {};
    const events = new EventTarget();
    Object.defineProperties(globalThis, {
      addEventListener: { configurable: true, value: events.addEventListener.bind(events) },
      removeEventListener: { configurable: true, value: events.removeEventListener.bind(events) },
      [BrowserConfigGlobalKey]: { configurable: true, value: config },
      document: {
        configurable: true,
        value: {
          get currentScript() {
            return currentScript;
          },
          baseURI: 'https://blog.test/posts/example/',
          createElement: (tag: string) => new Resource(tag),
          head: { appendChild: (resource: Resource) => tags.push(resource) },
        },
      },
    });
  });

  afterEach(() => {
    keys.forEach((key, i) => {
      const descriptor = originals[i];

      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      }
      else {
        Reflect.deleteProperty(globalThis, key);
      }
    });
  });

  it('复杂对象原样返回，函数、实例和循环引用保留，缓存复用同一对象', async () => {
    class Counter {
      value = 0;
      increment() {
        return ++this.value;
      }
    }
    const counter = new Counter();
    const module = { counter, run: () => counter.increment(), self: null as unknown };
    module.self = module;
    config.lazyScripts.complex = ['/complex.js'];
    const pending = loadResource<typeof module>('complex');
    await tick();
    currentScript = tags[0];
    setScriptExports(module);
    currentScript = null;
    tags[0].onload!();
    const loaded = await pending;
    strictEqual(loaded, module);
    strictEqual(loaded.self, loaded);
    strictEqual(loaded.counter instanceof Counter, true);
    strictEqual(loaded.run(), 1);
    strictEqual(await loadResource<typeof module>('complex'), loaded);
    strictEqual(tags.length, 1);
  });

  it('不同脚本并发完成时导出值按元素隔离，相同地址共用返回值', async () => {
    config.lazyScripts.alpha = ['/alpha.js'];
    config.lazyScripts.alias = ['/alpha.js'];
    config.lazyScripts.beta = ['/beta.js'];
    const alpha = loadResource<{ name: string }>('alpha');
    const alias = loadResource<{ name: string }>('alias');
    const beta = loadResource<{ name: string }>('beta');
    await tick();
    strictEqual(tags.length, 2);
    const first = { name: 'alpha' };
    const second = { name: 'beta' };
    currentScript = tags[1];
    setScriptExports(second);
    tags[1].onload!();
    currentScript = tags[0];
    setScriptExports(first);
    tags[0].onload!();
    currentScript = null;
    strictEqual(await beta, second);
    strictEqual(await alpha, first);
    strictEqual(await alias, first);
    strictEqual(getScriptExports(tags[0] as unknown as HTMLScriptElement), first);
  });

  it('导出值允许 false、0、null，脱离脚本执行时写入会报错', () => {
    const script = new Resource('script');
    currentScript = script;
    for (const value of [false, 0, null]) {
      setScriptExports(value);
      strictEqual(getScriptExports(script as unknown as HTMLScriptElement), value);
    }
    currentScript = null;
    throws(() => setScriptExports({}), /同步执行期间/);
  });

  it('CSS 加载完成后按顺序执行 JS，返回最后一个 JS 的导出', async () => {
    config.lazyScripts.mixed = ['/first.js?v=1', './theme.css?v=1', '/second.js'];
    const pending = loadResource<{ final: boolean }>('mixed');
    await tick();
    strictEqual(tags.length, 1);
    strictEqual(tags[0].tag, 'link');
    strictEqual(tags[0].rel, 'stylesheet');
    strictEqual(tags[0].href, 'https://blog.test/posts/example/theme.css?v=1');
    tags[0].onload!();
    await tick();
    strictEqual(tags.length, 2);
    strictEqual(tags[1].src, 'https://blog.test/first.js?v=1');
    strictEqual(tags[1].async, false);
    tags[1].onload!();
    await tick();
    strictEqual(tags.length, 3);
    strictEqual(tags[2].src, 'https://blog.test/second.js');
    const result = { final: true };
    currentScript = tags[2];
    setScriptExports(result);
    currentScript = null;
    tags[2].onload!();
    strictEqual(await pending, result);
  });

  it('并发调用及不同名称引用同一资源都只加载一次', async () => {
    config.lazyScripts.one = ['/shared.js'];
    config.lazyScripts.two = ['/shared.js'];
    const pending = Promise.all([loadResource('one'), loadResource('two')]);
    await tick();
    strictEqual(tags.length, 1);
    tags[0].onload!();
    await pending;
    await loadResource('one');
    strictEqual(tags.length, 1);
  });

  it('CSS 或 JS 失败后移除标签，重试不会重复执行已成功的 JS', async () => {
    config.lazyScripts.retry = ['/retry.css', '/good.js', '/retry.js'];
    const cssFailed = rejects(loadResource('retry'), /异步资源加载失败/);
    await tick();
    tags[0].onerror!();
    await cssFailed;
    strictEqual(tags[0].removed, true);
    const jsFailed = rejects(loadResource('retry'), /异步资源加载失败/);
    await tick();
    tags[1].onload!();
    await tick();
    tags[2].onload!();
    await tick();
    tags[3].onerror!();
    await jsFailed;
    strictEqual(tags[3].removed, true);
    const retried = loadResource('retry');
    await tick();
    strictEqual(tags.length, 5);
    strictEqual(tags[4].src, 'https://blog.test/retry.js');
    tags[4].onload!();
    await retried;
  });

  it('只有 CSS 时也等待加载完成，空资源列表直接完成', async () => {
    config.lazyScripts.css = ['/only.css'];
    config.lazyScripts.empty = [];
    const pending = loadResource('css');
    await tick();
    tags[0].onload!();
    await pending;
    await loadResource('empty');
    strictEqual(tags.length, 1);
  });

  it('未登记名称报错，取消后不再插入后续脚本', async () => {
    await rejects(loadResource('missing'), /未配置异步脚本/);
    strictEqual(tags.length, 0);
    config.lazyScripts.abort = ['/abort.css', '/abort.js'];
    const controller = new AbortController();
    const aborted = rejects(loadResource('abort', controller.signal), { name: 'AbortError' });
    await tick();
    controller.abort();
    tags[0].onload!();
    await aborted;
    strictEqual(tags.length, 1);
  });
});
