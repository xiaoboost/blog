import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { GlobalKey } from '@blog/context';
import type { callHook } from '@blog/context/runtime';
import type {
  BuildContext,
  IPage,
  IRenderContext,
  ISite,
  OnBuild,
  OnBuildWithRender,
} from '@blog/types';
import { build } from 'esbuild';
import { before, describe, it } from 'mocha';

interface Runtime {
  onBuild: OnBuild;
  onBuildWithRender: OnBuildWithRender;
  waitReady: Promise<void>;
  callHook: typeof callHook;
  render<Input, Result>(
    useFeature: (input: Input) => Result,
    input: Input,
    context?: IRenderContext,
  ): string;
}

describe('onBuildWithRender', () => {
  const runtimeRequire = createRequire(resolve(__dirname, '../../../generator/package.json'));
  const site = { title: 'fixture' } as ISite;
  const logger = { debug() {}, info() {}, error() {} };
  let code: string;

  before(async () => {
    const result = await build({
      stdin: {
        contents: `
          import { createElement } from 'react';
          import { renderToStaticMarkup } from 'react-dom/server';
          import { RenderContext } from './runtime';
          export { onBuild, onBuildWithRender, waitReady, callHook } from './runtime';

          export function render(useFeature, input, context) {
            function Component() {
              return createElement('span', null, useFeature(input));
            }
            const element = createElement(Component);
            return renderToStaticMarkup(context
              ? createElement(RenderContext.Provider, { value: context }, element)
              : element);
          }
        `,
        resolveDir: resolve(__dirname, '../../../context/src'),
      },
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'cjs',
      write: false,
      define: { 'process.env.NODE_ENV': '"production"' },
    });
    code = result.outputFiles[0].text;
  });

  function nextBuild(memory = new Map<string, unknown>()): Runtime {
    const module = { exports: {} as Runtime };
    runInNewContext(code, {
      module,
      exports: module.exports,
      require: runtimeRequire,
      process,
      setTimeout,
      [GlobalKey.Memory]: memory,
      [GlobalKey.Builder]: { options: { mode: 'production' }, logger },
      [GlobalKey.RuntimeCallbacks]: [],
    });
    return module.exports;
  }

  function context(title = 'page'): IRenderContext {
    return {
      page: { title, pathname: `/${title}/` } as IPage,
      site,
      dev: false,
      isPreBuild: true,
    };
  }

  it('复用 onBuild 的执行顺序，未渲染的 hook 也能注册 beforeStart', async () => {
    const runtime = nextBuild();
    const events: string[] = [];
    runtime.onBuild(() => events.push('before'));
    runtime.onBuildWithRender<string>(({ hooks }) => {
      events.push('setup');
      hooks.beforeStart.tap('fixture', () => events.push('beforeStart'));
      return () => {
        events.push('render');
      };
    });
    runtime.onBuild(() => events.push('after'));
    assert.deepEqual(events, []);

    await runtime.waitReady;
    await runtime.callHook('beforeStart');
    assert.deepEqual(events, [
      'before',
      'setup',
      'after',
      'beforeStart',
    ]);
  });

  it('跨组件和页面收集 input，等待构建 hook 后使用当前 input 与渲染上下文', async () => {
    const runtime = nextBuild();
    const first = context('first');
    const second = context('second');
    const seen: IRenderContext[] = [];
    let setups = 0;
    const useText = runtime.onBuildWithRender<string, string | undefined>(({ hooks }) => {
      setups++;
      const collected = new Map<IPage, string[]>();
      const results = new Map<IPage, string>();
      hooks.beforeBuild.tapPromise('fixture', async ({ pages }) => {
        await Promise.resolve();
        for (const page of pages) {
          results.set(page, (collected.get(page) ?? []).join('|'));
        }
      });
      return (input, ctx) => {
        seen.push(ctx);

        if (ctx.isPreBuild) {
          const texts = collected.get(ctx.page) ?? [];
          texts.push(input);
          collected.set(ctx.page, texts);
          return;
        }

        return `${results.get(ctx.page)}:${input}`;
      };
    });

    await runtime.waitReady;
    assert.equal(runtime.render(useText, 'A', first), '<span></span>');
    assert.equal(runtime.render(useText, 'B', first), '<span></span>');
    assert.equal(runtime.render(useText, 'C', second), '<span></span>');
    const buildContext: BuildContext = {
      pages: [first.page, second.page],
      site,
      logger,
      rename: (asset) => asset.path,
    };
    await runtime.callHook('beforeBuild', buildContext);
    const finalFirst = { ...first, isPreBuild: false };
    const finalSecond = { ...second, isPreBuild: false };
    assert.equal(runtime.render(useText, 'D', finalFirst), '<span>A|B:D</span>');
    assert.equal(runtime.render(useText, 'E', finalSecond), '<span>C:E</span>');
    assert.equal(setups, 1);
    [
      first,
      first,
      second,
      finalFirst,
      finalSecond,
    ].forEach((ctx, index) => {
      assert.equal(seen[index], ctx);
    });
  });

  it('各次注册分别保存闭包，支持没有返回值的渲染回调', async () => {
    const runtime = nextBuild();
    const ctx = context();
    const createCounter = () => runtime.onBuildWithRender<number, number>(() => {
      let total = 0;
      return (input) => (total += input);
    });
    const first = createCounter();
    const second = createCounter();
    let submitted = '';
    const useSubmit = runtime.onBuildWithRender<string>(() => (input) => {
      submitted += input;
    });

    await runtime.waitReady;
    assert.equal(runtime.render(first, 1, ctx), '<span>1</span>');
    assert.equal(runtime.render(second, 10, ctx), '<span>10</span>');
    assert.equal(runtime.render(first, 2, ctx), '<span>3</span>');
    assert.equal(runtime.render(useSubmit, 'text', ctx), '<span></span>');
    assert.equal(submitted, 'text');
  });

  it('新一轮构建重新创建闭包，共享访问器保持原有行为', async () => {
    const memory = new Map<string, unknown>();
    for (let round = 1; round <= 2; round++) {
      const runtime = nextBuild(memory);
      const useCount = runtime.onBuildWithRender<number, string>(({ getAccessor }) => {
        const builds = getAccessor('builds', 0);
        builds.set(builds.get() + 1);
        let count = 0;
        return (input) => `${builds.get()}:${count += input}`;
      });

      await runtime.waitReady;
      assert.equal(runtime.render(useCount, 1, context()), `<span>${round}:1</span>`);
      assert.equal(runtime.render(useCount, 2, context()), `<span>${round}:3</span>`);
    }
  });

  it('初始化前或缺少渲染上下文时给出明确错误', async () => {
    const runtime = nextBuild();
    const useText = runtime.onBuildWithRender<string, string>(() => (input) => input);
    assert.throws(() => runtime.render(useText, 'text', context()), /构建初始化完成后/);

    await runtime.waitReady;
    assert.throws(() => runtime.render(useText, 'text'), /RenderContext/);
  });
});
