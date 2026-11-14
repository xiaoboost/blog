import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { GlobalKey } from '@blog/context';
import type { callHook } from '@blog/context/runtime';
import { normalize, type FontBucket } from '@blog/node';
import type { BuildContext, IRenderContext, RuntimeContext } from '@blog/types';
import { build } from 'esbuild';
import { before, describe, it } from 'mocha';

interface FontInput {
  src: string;
  baseDir?: string;
  text: string;
}

interface Runtime {
  waitReady: Promise<void>;
  callHook: typeof callHook;
  render(input: FontInput, context?: IRenderContext): string;
  context(pathname?: string): IRenderContext;
  resolveFontPath(src: string, options: {
    postPath?: string;
    baseDir?: string;
    resolve: RuntimeContext['resolve'];
  }): string;
}

const fontRoot = resolve(__dirname, '../../../../components/font-block/src');
const runtimeRoot = resolve(__dirname, '../../../context/src/runtime');
const source = resolve(__dirname, '../../../../templates/layout/src/assets/fonts/Lato/Lato-Regular.ttf');
const logger = { debug() {}, info() {}, error() {} };

function chars(ctx: IRenderContext, family = 'lato-regular') {
  return [...(ctx.page.getFontBucket(family) as FontBucket).getChars()].sort().join('');
}

describe('FontBlock 构建与渲染', () => {
  const runtimeRequire = createRequire(resolve(fontRoot, '../package.json'));
  let code: string;

  before(async () => {
    const result = await build({
      stdin: {
        contents: `
          import { createElement } from 'react';
          import { renderToStaticMarkup } from 'react-dom/server';
          import { RenderContext } from '@blog/context/runtime';
          import { useFontBlock } from './font';
          import { Page } from ${JSON.stringify(resolve(__dirname, '../../../generator/src/model/page.ts'))};
          import { Site } from ${JSON.stringify(resolve(__dirname, '../../../generator/src/model/site.ts'))};
          export { waitReady, callHook } from '@blog/context/runtime';
          export { resolveFontPath } from './utils';
          const site = new Site({
            title: 'fixture', origin: 'https://example.com', publicPath: '/',
            aboutPath: 'about', tagPath: 'tags', archivePath: 'archive',
          });
          export function context(pathname = '/first/') {
            return {
              site, dev: false, isPreBuild: true,
              page: new Page({
                type: 'index', pathname, title: 'fixture',
                data: { posts: [], index: 0, count: 1 }, render: () => '',
              }),
            };
          }
          export function render(input, context) {
            function Component() {
              return createElement('span', null, useFontBlock(input));
            }
            const element = createElement(Component);
            return renderToStaticMarkup(context
              ? createElement(RenderContext.Provider, { value: context }, element)
              : element);
          }
        `,
        resolveDir: fontRoot,
      },
      plugins: [
        {
          name: 'font-block-runtime',
          setup(bundler) {
            bundler.onResolve({ filter: /^@blog\/context\/runtime$/ }, () => ({
              path: resolve(runtimeRoot, 'index.ts'),
            }));
          },
        },
      ],
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'cjs',
      write: false,
      define: { 'process.env.NODE_ENV': '"production"' },
    });
    code = result.outputFiles[0].text;
  });

  async function nextBuild(memory = new Map<string, unknown>()) {
    const module = { exports: {} as Runtime };
    const watched = new Set<string>();
    runInNewContext(code, {
      module,
      exports: module.exports,
      require: runtimeRequire,
      process,
      Buffer,
      setTimeout,
      [GlobalKey.Memory]: memory,
      [GlobalKey.Builder]: {
        options: { mode: 'production' },
        logger,
        resolve: () => ({ path: source }),
        addWatchFiles: (path: string) => watched.add(path),
      },
      [GlobalKey.RuntimeCallbacks]: [],
    });
    await module.exports.waitReady;
    return { ...module.exports, watched };
  }

  async function buildFonts(runtime: Runtime, ...contexts: IRenderContext[]) {
    const ctx: BuildContext = {
      site: contexts[0].site,
      pages: contexts.map(({ page }) => page),
      logger,
      rename: ({ path }) => path,
    };
    await runtime.callHook('beforeBuild', ctx);
  }

  it('同页不同写法的相同字体合并文字，跨页各自生成子集', async () => {
    const runtime = await nextBuild();
    const first = runtime.context();
    const second = runtime.context('/second/');
    assert.equal(runtime.render({ src: source, text: 'ABA' }, first), '<span></span>');
    runtime.render({ src: '@blog/fonts/regular', text: 'BC' }, first);
    runtime.render({ src: source, text: 'X' }, second);
    assert.equal(first.page.getFontBuckets().size, 0);
    await buildFonts(runtime, first, second);

    assert.equal(first.page.getFontBuckets().size, 1);
    assert.equal(chars(first), 'ABC');
    assert.equal(chars(second), 'X');
    assert.equal(first.page.getStyles()[0].href, '/first/font-block.css');
    assert.equal(first.page.getPreloads().length, 1);
    assert.equal(first.page.getAssets().length, 2);
    assert.equal(first.page.getFontBucket('lato-regular').getFont().path, '/first/lato-regular.woff2');
    assert.equal(second.page.getFontBucket('lato-regular').getFont().path, '/second/lato-regular.woff2');
    const css = first.page.getAssets().find(({ path }) => path.endsWith('.css'))!.content.toString();
    assert.ok(css.includes('@font-face'));
    assert.ok(css.includes('.lato-regular{'));

    const assets = first.page.getAssets();
    assert.equal(runtime.render({ src: source, text: 'NEW' }, {
      ...first, isPreBuild: false,
    }), '<span>lato-regular</span>');
    assert.equal(chars(first), 'ABC');
    assert.deepEqual(first.page.getAssets(), assets);
    assert.deepEqual([...runtime.watched], [normalize(source)]);
  });

  it('字体名避开页面预设字体和同名文件，保持一页一份合并 CSS', async () => {
    const runtime = await nextBuild();
    const ctx = runtime.context();
    const content = await readFile(source);
    ctx.page.ensureFontBucket('lato-regular', content);
    ctx.page.ensureFontBucket('lato-regular-2', content);
    const woffSource = source.replace(/\.ttf$/, '.woff2');
    runtime.render({ src: source, text: 'A' }, ctx);
    runtime.render({ src: woffSource, text: 'B' }, ctx);
    await buildFonts(runtime, ctx);

    assert.equal(chars(ctx, 'lato-regular'), '');
    assert.equal(chars(ctx, 'lato-regular-3'), 'A');
    assert.equal(chars(ctx, 'lato-regular-4'), 'B');
    assert.equal(ctx.page.getStyles().length, 1);
    assert.equal(ctx.page.getPreloads().length, 2);
    assert.equal(ctx.page.getAssets().length, 3);
  });

  it('新一轮重新收集文字，继续复用访问器里的原始字体缓存', async () => {
    const memory = new Map<string, unknown>();
    const first = await nextBuild(memory);
    const firstPage = first.context();
    first.render({ src: source, text: 'OLD' }, firstPage);
    await buildFonts(first, firstPage);
    const cache = memory.get('var::font-block:source') as Map<string, { content: Buffer }>;
    const content = cache.get(normalize(source))!.content;

    const second = await nextBuild(memory);
    assert.throws(() => second.render({ src: source, text: 'OLD' }, {
      ...firstPage, isPreBuild: false,
    }), /未在预渲染中收集字体/);
    const secondPage = second.context();
    second.render({ src: source, text: 'NEW' }, secondPage);
    await buildFonts(second, secondPage);
    assert.equal(chars(secondPage), 'ENW');
    assert.equal(cache.get(normalize(source))!.content, content);
  });

  it('正式渲染不能补登记字体，缺少渲染上下文时仍然报错', async () => {
    const runtime = await nextBuild();
    const ctx = runtime.context();
    assert.throws(() => runtime.render({ src: source, text: 'A' }, {
      ...ctx, isPreBuild: false,
    }), /未在预渲染中收集字体/);
    assert.throws(() => runtime.render({ src: source, text: 'A' }), /需要在 RenderContext 中调用/);
    await buildFonts(runtime, ctx);
    assert.equal(ctx.page.getAssets().length, 0);
  });

  it('缺失字体在读取前登记监听依赖，构建时报告文件错误', async () => {
    const runtime = await nextBuild();
    const ctx = runtime.context();
    const missing = `${source}.missing`;
    runtime.render({ src: missing, text: 'A' }, ctx);
    assert.ok(runtime.watched.has(normalize(missing)));
    await assert.rejects(buildFonts(runtime, ctx), { code: 'ENOENT' });
  });
  describe('字体路径', () => {
    let resolveFontPath: Runtime['resolveFontPath'];

    before(async () => {
      resolveFontPath = (await nextBuild()).resolveFontPath;
    });
    const postPath = resolve('fixture/posts/article/index.mdx');
    const baseDir = resolve('fixture/shared');
    const resolveModule = () => ({ path: source });

    it('保留绝对路径、文章相对路径、posts 相对路径和显式 baseDir', () => {
      const options = { postPath, resolve: resolveModule };
      assert.equal(resolveFontPath(source, options), normalize(source));
      assert.equal(resolveFontPath('./font.ttf', options), normalize(resolve('fixture/posts/article/font.ttf')));
      assert.equal(resolveFontPath('../font.ttf', options), normalize(resolve('fixture/posts/font.ttf')));
      assert.equal(resolveFontPath('fonts/font.ttf', options), normalize(resolve('fixture/posts/fonts/font.ttf')));
      assert.equal(resolveFontPath('font.ttf', { ...options, baseDir }), normalize(resolve(baseDir, 'font.ttf')));
    });

    it('包路径解析收到文章位置和显式 baseDir', () => {
      const fontPath = resolveFontPath('@blog/fonts/regular', {
        postPath,
        baseDir,
        resolve(request, options) {
          assert.equal(request, '@blog/fonts/regular');
          assert.equal(options?.importer, postPath);
          assert.equal(options?.resolveDir, baseDir);
          return { path: source };
        },
      });
      assert.equal(fontPath, normalize(source));
    });

    it('缺少基准目录和相对 baseDir 继续报错', () => {
      const options = { resolve: resolveModule };
      assert.throws(() => resolveFontPath('./font.ttf', options), /需要 baseDir/);
      assert.throws(() => resolveFontPath('fonts/font.ttf', options), /未找到 posts 目录/);
      assert.throws(() => resolveFontPath(source, { ...options, baseDir: './fonts' }), /必须是绝对目录/);
    });
  });
});
