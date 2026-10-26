import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import { runInNewContext } from 'node:vm';
import * as nodeUtils from '@blog/node';
import type {
  AssetData,
  BuildContext,
  IPage,
  IRenderContext,
  ISite,
} from '@blog/types';
import { build } from 'esbuild';
import {
  before,
  beforeEach,
  describe,
  it,
} from 'mocha';
import { AsyncSeriesHook } from 'tapable';

function resourceSet() {
  const assets = new Map<string, Buffer>();
  return {
    assets,
    addAsset({ path, content }: AssetData) {
      assets.set(path, content);
    },
  };
}

function page(pathname: string, coverImage?: string) {
  return {
    ...resourceSet(),
    pathname,
    type: 'post',
    data: {
      post: { data: { filePath: resolve(__dirname, 'fixtures/index.mdx'), coverImage } },
    },
  };
}

describe('Layout OG 原图路径与构建阶段', () => {
  const layoutRoot = resolve(__dirname, '../../../../templates/layout/src');
  const ogImagePath = join(layoutRoot, 'components/document/og-image.ts');
  const layoutRequire = createRequire(ogImagePath);
  const defaultPath = nodeUtils.normalize(join(layoutRoot, 'assets/images/og-default.png'));
  const sourcePath = nodeUtils.normalize(resolve(__dirname, 'fixtures/封面%20.v2.svg'));
  const source = (color: string) => Buffer.from(`<svg width="100" height="300"><rect width="100" height="300" fill="${color}"/></svg>`);
  let code: string;
  let defaultSource: Buffer;
  let context: IRenderContext;
  let site: ReturnType<typeof resourceSet>;
  let hooks: {
    beforeBuild: AsyncSeriesHook<[BuildContext]>;
  };
  let useOgImage: (path?: string) => string | undefined;
  let sources: Map<string, Buffer>;
  let watched: Set<string>;
  let conversions: number;
  let reads: number;
  let memory: Map<string, unknown>;

  function render(target: ReturnType<typeof page>, isPreBuild: boolean, path?: string) {
    context = {
      page: target as unknown as IPage,
      site: site as unknown as ISite,
      isPreBuild,
      dev: false,
    };
    return useOgImage(path);
  }

  async function convert(pages: ReturnType<typeof page>[] = [], production = true) {
    await hooks.beforeBuild.promise({
      site: site as unknown as ISite,
      pages: pages as unknown as IPage[],
      logger: console,
      rename: ({ path, content }) => production
        ? `/images/${basename(path, '.jpg')}.${createHash('md5').update(content).digest('hex')}.jpg`
        : `/images/${path}`,
    });
  }

  before(async () => {
    defaultSource = await readFile(join(layoutRoot, 'assets/images/og-default.png'));
    const result = await build({
      entryPoints: [ogImagePath],
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'cjs',
      write: false,
    });
    code = result.outputFiles[0].text;
  });

  function nextVm() {
    site = resourceSet();
    hooks = {
      beforeBuild: new AsyncSeriesHook<[BuildContext]>(['context']),
    };
    const module = { exports: {} as { useOgImage: typeof useOgImage } };
    runInNewContext(code, {
      __dirname: dirname(ogImagePath),
      module,
      exports: module.exports,
      require(name: string) {
        if (name === '@blog/context/runtime') {
          return {
            getAccessor: (name: string, init: () => unknown) => {
              if (!memory.has(name)) {
                memory.set(name, init());
              }

              return { get: () => memory.get(name) };
            },
            Builder: { addWatchFiles: (path: string) => watched.add(path) },
            onBuild: (setup: (runtime: { hooks: typeof hooks }) => void) => setup({ hooks }),
            useRenderContext: () => context,
          };
        }

        if (name === '@blog/node') {
          return {
            ...nodeUtils,
            convertImage: (...args: Parameters<typeof nodeUtils.convertImage>) => {
              conversions++;
              return nodeUtils.convertImage(...args);
            },
          };
        }

        if (name === 'fs/promises') {
          return {
            readFile: async (path: string) => {
              reads++;
              const content = sources.get(nodeUtils.normalize(path));

              if (!content) {
                throw new Error('ENOENT');
              }

              return Buffer.from(content);
            },
          };
        }

        return layoutRequire(name);
      },
    });
    useOgImage = module.exports.useOgImage;
  }

  beforeEach(() => {
    sources = new Map([[sourcePath, source('red')], [defaultPath, defaultSource]]);
    watched = new Set();
    conversions = 0;
    reads = 0;
    memory = new Map();
    nextVm();
  });

  it('直接扫描页面封面，无需预渲染即可生成固定规格的图片', async () => {
    const target = page('/custom/', './封面%20.v2.svg');
    await convert([target]);
    const path = render(target, false, sourcePath)!;
    const content = target.assets.get(path)!;
    assert.deepEqual(nodeUtils.readImageMetadata(content), { width: 1200, height: 630, mimeType: 'image/jpeg' });
    assert.equal(path, `/custom/images/封面%20.v2.og.${createHash('md5').update(content).digest('hex')}.jpg`);
    assert.equal(target.assets.size, 1);
    assert.equal(watched.has(sourcePath), true);
    assert.equal(conversions, 1);
    assert.equal(site.assets.size, 0); // 没有页面需要默认图。
  });

  it('同轮共用原图只转换一次，每个页面得到自己的资源地址', async () => {
    const first = page('/first/', './封面%20.v2.svg');
    const second = page('/second/', './封面%20.v2.svg');
    await convert([first, second]);
    assert.equal(conversions, 1);
    assert.equal(reads, 1);
    assert.notEqual(render(first, false, sourcePath), render(second, false, sourcePath));
    assert.equal(first.assets.size, 1);
    assert.equal(second.assets.size, 1);
  });

  it('没有封面的页面跳过转换，共享一张默认图', async () => {
    const first = page('/first/');
    const second = page('/second/');
    const index = page('/');
    index.type = 'index';
    Object.defineProperty(index, 'data', {
      get() {
        throw new Error('不应读取非文章数据');
      },
    });
    await convert([first, second, index]);
    assert.equal(conversions, 1);
    assert.equal(site.assets.size, 1);
    assert.equal(first.assets.size + second.assets.size, 0);
    assert.deepEqual([...watched], [defaultPath]);
    assert.equal(render(first, false), render(second, false));
  });

  it('缓存命中不重新读取原图，移除封面后只登记默认图', async () => {
    const first = page('/first/', './封面%20.v2.svg');
    await convert([first]);
    const previous = render(first, false, sourcePath);
    sources.set(sourcePath, source('blue'));
    const second = page('/first/', './封面%20.v2.svg');
    await convert([second]);
    assert.equal(render(second, false, sourcePath), previous);
    assert.equal(conversions, 1);
    assert.equal(reads, 1);
    const third = page('/first/');
    await convert([third]);
    assert.equal(conversions, 2);
    assert.equal(third.assets.size, 0);
    assert.ok(render(third, false)?.includes('og-default.og.'));
  });

  it('缺失和损坏的封面会报告原图路径与页面', async () => {
    const target = page('/broken/', './封面%20.v2.svg');
    for (const content of [undefined, Buffer.from('not an image')]) {
      if (content) {
        sources.set(sourcePath, content);
      }
      else {
        sources.delete(sourcePath);
      }

      await assert.rejects(convert([target]), (error: Error) => {
        assert.ok(error.message.includes(sourcePath));
        assert.ok(error.message.includes('/broken/'));
        return true;
      });
      assert.equal(watched.has(sourcePath), true);
    }
  });

  it('预渲染不登记任务、不读图、不添加监听；正式渲染只读取已构建映射', async () => {
    const target = page('/unused/');
    assert.equal(render(target, true, sourcePath), undefined);
    assert.equal(conversions, 0);
    assert.equal(watched.size, 0);
    await convert([target]);
    assert.equal(conversions, 1);
    assert.equal(target.assets.size, 0);
    assert.equal(watched.has(defaultPath), true);
    assert.throws(() => render(target, false, sourcePath), /尚未生成/);
    assert.ok(render(target, false));
  });

  it('新 VM 命中缓存不读图、不转换，仍重新登记资源', async () => {
    await convert([page('/first/', './封面%20.v2.svg'), page('/')]);
    const defaultUrl = render(page('/'), false);
    assert.equal(conversions, 2);
    assert.equal(reads, 2);
    nextVm();
    const second = page('/second/', './封面%20.v2.svg');
    await convert([second, page('/')]);
    assert.equal(conversions, 2);
    assert.equal(reads, 2);
    assert.equal(second.assets.size, 1);
    assert.equal(site.assets.size, 1);
    assert.equal(render(page('/'), false), defaultUrl);
  });

  it('重启缓存后读取更新的默认图', async () => {
    await convert([page('/')]);
    const previous = render(page('/'), false);
    sources.set(defaultPath, source('green'));
    memory = new Map();
    nextVm();
    await convert([page('/')]);
    assert.notEqual(render(page('/'), false), previous);
    assert.equal(conversions, 2);
    assert.equal(reads, 2);
  });

  it('缓存不保留旧命名规则，切换构建模式重新生成路径', async () => {
    const first = page('/first/', './封面%20.v2.svg');
    await convert([first], false);
    assert.equal(render(first, false, sourcePath), '/first/images/封面%20.v2.og.jpg');
    nextVm();
    const second = page('/second/', './封面%20.v2.svg');
    await convert([second]);
    assert.match(render(second, false, sourcePath)!, /\.og\.[a-f0-9]{32}\.jpg$/);
    assert.equal(conversions, 1);
    assert.equal(reads, 1);
  });

  it('原图读取失败不留下缓存，恢复后可继续构建', async () => {
    sources.delete(sourcePath);
    nextVm();
    await assert.rejects(convert([page('/first/', './封面%20.v2.svg')]), /ENOENT/);
    sources.set(sourcePath, source('red'));
    await convert([page('/first/', './封面%20.v2.svg')]);
    assert.equal(reads, 2);
    assert.equal(conversions, 1);
  });
});
