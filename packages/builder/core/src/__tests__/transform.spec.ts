import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import type { SourceMapV3, TransformContext, TransformState } from '@blog/types';
import { build, type OnLoadArgs } from 'esbuild';
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'mocha';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { loadAndTransform } from '../bundler/pipeline';
import { hookData, interceptHookMap } from '../plugins/interceptor/hooks/utils';
import { MdxLoader } from '../plugins/post-loader/mdx';
import { Resolver } from '../plugins/resolver';
import { Transformer } from '../plugins/script-loader/builder/transformer';

function args(path: string, namespace = 'file'): OnLoadArgs {
  return {
    path,
    namespace,
    suffix: '',
    pluginData: undefined,
    with: {},
  };
}

function mapLine(
  source: string,
  from: number,
  to: number,
  content: string,
): SourceMapV3 {
  const map = new SourceMapGenerator();
  map.addMapping({
    generated: { line: from, column: 0 }, original: { line: to, column: 0 }, source,
  });
  map.setSourceContent(source, content);
  return JSON.parse(map.toString());
}

describe('Transform 管道', function () {
  this.timeout(15000);
  let root: string;
  let builder: Builder;
  let bundler: Bundler;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'blog-transform-'));
    builder = new Builder({ root, logLevel: 'Silence', typeCheck: false });
    bundler = new Bundler(builder);
  });

  afterEach(async () => {
    await bundler.dispose();
    await builder.stop();
    await rm(root, { recursive: true, force: true });
  });

  it('原生 stage / before 排序，sync、promise、async 接力，新增 import 交给 esbuild 解析', async () => {
    const entry = join(root, 'index.ts');
    await writeFile(entry, 'export default 1;');
    await writeFile(join(root, 'answer.ts'), 'export const answer = 42;');
    const order: string[] = [];
    const hook = bundler.hooks.transform;

    hook.tapPromise({ name: 'last', stage: 100 }, async (input, ctx) => {
      if (input.module.sourcePath !== entry) {
        return input;
      }

      order.push('last');
      assert.match(input.code, /2/);
      return ctx.update(input, { code: "import { answer } from './answer'; export default answer;", map: null });
    });
    hook.tap('middle', (input) => {
      if (input.module.sourcePath === entry) {
        order.push('middle');
        assert.match(input.code, /2/);
      }

      return input;
    });
    hook.tapAsync({ name: 'first', before: 'middle' }, (input, ctx, callback) => {
      if (input.module.sourcePath !== entry) {
        callback(null, input);
        return;
      }

      order.push('first');
      callback(null, ctx.update(input, { code: input.code.replace('1', '2'), map: 'identity' }));
    });
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: 'cjs',
      plugins: [BridgePlugin(bundler, builder)],
      logLevel: 'silent',
    });
    const module = { exports: {} as { default: number } };
    runInNewContext(result.outputFiles![0].text, { module, exports: module.exports });
    assert.equal(module.exports.default, 42);
    assert.deepEqual(order, ['first', 'middle', 'last']);
  });

  it('MDX 编译后和普通 TSX 可以进入同一转换，来源路径保持不变', async () => {
    const entry = join(root, '中文 空格.mdx');
    const tsx = join(root, 'page.tsx');
    const source = '---\ntitle: 测试\ncreate: 2026-01-01\nupdate: 2026-01-02\n---\n\n# BEFORE';
    await writeFile(entry, source);
    await writeFile(tsx, 'export default <h1>BEFORE</h1>;');
    Resolver().apply(builder);
    MdxLoader().apply(builder);
    builder.hooks.bundler.call(bundler);
    const seen: Array<[string, string]> = [];
    bundler.hooks.transform.tap('same-edit', (input, ctx) => {
      if ((input.format === 'jsx' || input.format === 'tsx') && input.module.sourcePath) {
        seen.push([input.module.sourcePath, input.format]);
        return ctx.update(input, { code: input.code.replaceAll('BEFORE', 'AFTER'), map: null });
      }

      return input;
    });
    const mdxArgs = args(entry.replaceAll('\\', '/'), 'mdx-loader');
    const result = await loadAndTransform(builder, bundler.hooks, mdxArgs, {});
    const tsxResult = await loadAndTransform(builder, bundler.hooks, args(tsx), {});
    assert.equal(result?.loader, 'jsx');
    assert.match(result!.contents as string, /AFTER/);
    assert.match(tsxResult!.contents as string, /AFTER/);
    assert.deepEqual(seen, [[mdxArgs.path, 'jsx'], [tsx, 'tsx']]);

    const resolved = await bundler.hooks.resolve.promise({
      path: './中文 空格.mdx?preview',
      importer: join(root, 'index.ts'),
      namespace: 'file',
      resolveDir: root,
      kind: 'import-statement',
      pluginData: undefined,
      with: {},
    });
    assert.equal(resolved?.path, mdxArgs.path);
    assert.equal(resolved?.suffix, '?preview');
    const queried = await loadAndTransform(builder, bundler.hooks, { ...mdxArgs, suffix: '?preview' }, {});
    assert.equal(queried?.contents, result?.contents);
  });

  it('script 转换使用前一步的当前源码，不会重新读取磁盘', async () => {
    const entry = join(root, 'index.script.ts');
    await writeFile(entry, 'const assets = [];\nexport default assets;\nconsole.log("OLD");');
    Transformer().apply(builder);
    builder.hooks.bundler.call(bundler);
    bundler.hooks.transform.tap({ name: 'edit-source', stage: -100 }, (input) => ({
      ...input, code: input.code.replace('OLD', 'NEW'), map: null,
    }));
    const result = await loadAndTransform(builder, bundler.hooks, args(entry), {});
    assert.match(result!.contents as string, /NEW/);
    assert.doesNotMatch(result!.contents as string, /export default assets/);
    assert.equal(result?.loader, 'ts');
  });

  it('虚拟 load 提供内容，空字符串是有效模块，身份包含 suffix', async () => {
    const moduleArgs = { ...args('virtual:empty', 'virtual'), suffix: '?one' };
    bundler.hooks.load.tap('provide', () => ({ contents: '', pluginData: 42 }));
    bundler.hooks.transform.tap('see-empty', (input) => {
      assert.equal(input.code, '');
      assert.equal(input.format, 'js');
      assert.equal(input.module.sourcePath, undefined);
      assert.equal(input.module.id.path, 'virtual:empty');
      assert.equal(input.module.id.namespace, 'virtual');
      assert.equal(input.module.id.suffix, '?one');
      return input;
    });
    assert.equal((await loadAndTransform(builder, bundler.hooks, moduleArgs, {}))?.contents, '');
    assert.equal((await loadAndTransform(builder, bundler.hooks, moduleArgs, {}))?.pluginData, 42);
  });

  it('调试拦截器等待 tapAsync 完成后再记录，仍保留转换返回值', async () => {
    hookData.clear();
    let release!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    bundler.hooks.load.tap('provide', () => ({ contents: 'before' }));
    bundler.hooks.transform.tapAsync('deferred', (input, ctx, callback) => {
      release = () => callback(null, ctx.update(input, { code: 'after', map: null }));
      entered();
    });
    interceptHookMap('Bundler', { transform: bundler.hooks.transform }, {});
    const result = loadAndTransform(builder, bundler.hooks, args('virtual:stats', 'virtual'), {});
    await started;
    assert.equal(hookData.get('deferred'), undefined);
    release();
    assert.equal((await result)?.contents, 'after');
    assert.equal(hookData.get('deferred')?.get('Bundler')?.get('transform')?.length, 1);
    hookData.clear();
  });

  it('资源 loader 和错误结果旁路转换，普通无转换文件交回 esbuild', async () => {
    const binary = Buffer.from([255, 0, 128]);
    bundler.hooks.load.tap('binary', (input) => {
      if (input.path.endsWith('.bin')) {
        return { contents: binary, loader: 'file' };
      }

      if (input.path.endsWith('.broken')) {
        return { errors: [{ text: 'load failed' }] };
      }
    });
    bundler.hooks.transform.tap('unreachable', () => {
      throw new Error('不应转换二进制或错误结果');
    });
    assert.equal((await loadAndTransform(builder, bundler.hooks, args(join(root, 'asset.bin')), {}))?.contents, binary);
    assert.equal((await loadAndTransform(builder, bundler.hooks, args(join(root, 'asset.broken')), {}))?.errors?.[0].text, 'load failed');
    assert.equal(await loadAndTransform(builder, bundler.hooks, args(join(root, 'raw.ts')), { loader: { '.ts': 'binary' } }), undefined);

    const untouched = new Bundler(builder);
    assert.equal(await loadAndTransform(builder, untouched.hooks, args(join(root, 'native.ts')), {}), undefined);
  });

  it('无提供者时交回 esbuild，空结果原样返回，含 # 的来源仍报错', async () => {
    assert.equal(await loadAndTransform(builder, bundler.hooks, args('virtual:missing', 'virtual'), {}), undefined);
    bundler.hooks.load.tap('empty-result', (input) => input.path === 'empty' ? {} : undefined);
    assert.deepEqual(await loadAndTransform(builder, bundler.hooks, args('empty', 'virtual'), {}), {});
    bundler.hooks.transform.tap('skip', (input) => input);
    await assert.rejects(loadAndTransform(builder, bundler.hooks, args(join(root, 'bad#path.ts')), {}), /不能含有 #/);
  });

  it('每个并发模块独立合并依赖；失败前登记的依赖仍能使父子构建失效', async () => {
    const parent = builder;
    const child = new Builder({ root, logLevel: 'Silence' }, parent);
    const childBundler = new Bundler(child);
    const dependency = join(root, 'config.json');
    const directory = join(root, 'pages');
    const failure = { message: 'failed after dependencies' };
    childBundler.hooks.load.tap('provide', (input) => ({ contents: input.path, watchFiles: [dependency] }));
    childBundler.hooks.transform.tapPromise('depend', async (input, ctx) => {
      ctx.addWatchFile(dependency);
      ctx.addWatchFile(join(root, input.code));
      ctx.addWatchDir(directory);
      await Promise.resolve();

      if (input.code === 'broken') {
        throw failure;
      }

      return input;
    });
    const results = await Promise.all(['one', 'two'].map((path) => loadAndTransform(child, childBundler.hooks, args(path, 'virtual'), {})));
    assert.deepEqual(results[0]?.watchFiles, [dependency, join(root, 'one')]);
    assert.deepEqual(results[1]?.watchFiles, [dependency, join(root, 'two')]);
    assert.deepEqual(results[0]?.watchDirs, [directory]);
    assert.equal(parent.shouldBuild, false);
    await assert.rejects(loadAndTransform(child, childBundler.hooks, args('broken', 'virtual'), {}), (err) => err === failure);
    parent.setChangeFiles(join(directory, 'new-page.tsx'));
    assert.equal(parent.shouldBuild, true);
    assert.equal(child.shouldBuild, true);
  });

  it('直接返回完整状态由 Tapable 传给下一步', async () => {
    bundler.hooks.load.tap('provide', () => ({ contents: 'one' }));
    bundler.hooks.transform.tap('full-state', (input) => ({ ...input, code: 'two', map: null }));
    bundler.hooks.transform.tap('check-state', (input) => {
      assert.equal(input.code, 'two');
      return input;
    });
    assert.equal((await loadAndTransform(builder, bundler.hooks, args('virtual:source', 'virtual'), {}))?.contents, 'two');
  });

  it('update 同步连接两步映射，identity 保留，null 切断；输入不被修改', async () => {
    let original!: TransformState;
    let ctx!: TransformContext;
    bundler.hooks.load.tap('provide', () => ({ contents: 'original', loader: 'ts' }));
    bundler.hooks.transform.tap('capture', (input, context) => {
      original = input;
      ctx = context;
      return input;
    });
    await loadAndTransform(builder, bundler.hooks, args(join(root, 'entry.ts')), {});
    const first = ctx.update(original, { code: '\nfirst', map: mapLine('original.ts', 2, 3, 'a\nb\noriginal') });
    const second = ctx.update(first, { code: 'second', map: mapLine('intermediate.ts', 1, 2, first.code) });
    assert.equal(original.code, 'original');
    const consumer = await new SourceMapConsumer(JSON.stringify(second.map));
    try {
      assert.deepEqual(consumer.originalPositionFor({ line: 1, column: 0 }), {
        source: 'original.ts',
        line: 3,
        column: 0,
        name: null,
      });
      assert.equal(consumer.sourceContentFor('original.ts'), 'a\nb\noriginal');
    }
    finally {
      consumer.destroy();
    }
    assert.equal(ctx.update(second, { code: 'same-position', map: 'identity' }).map, second.map);
    const broken = ctx.update(second, { code: 'unmapped', map: null });
    assert.equal(ctx.update(broken, { code: 'later', map: mapLine('generated.ts', 1, 1, 'unmapped') }).map, null);
    assert.throws(() => ctx.update(original, { code: 'no map' } as any), /map 必须/);
    assert.throws(() => ctx.addWatchFile('./relative'), /绝对路径/);
  });

  it('累计 map 交给 esbuild 后仍能定位原始源码，旧 inline map 可继续连接', async () => {
    const original = join(root, 'original.ts');
    const entry = join(root, 'entry.ts');
    const source = '\n\nexport default 42;';
    const previous = mapLine(original, 2, 3, source);
    await writeFile(entry, `\nexport default 42;\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(previous)).toString('base64')}`);
    bundler.hooks.transform.tap('remove-line', (input, ctx) => ctx.update(input, {
      code: 'export default 42;', map: mapLine(entry, 1, 2, input.code),
    }));
    const result = await build({
      entryPoints: [entry],
      write: false,
      bundle: true,
      format: 'esm',
      sourcemap: 'external',
      outfile: join(root, 'out.js'),
      plugins: [BridgePlugin(bundler, builder)],
    });
    const code = result.outputFiles!.find((file) => file.path.endsWith('.js'))!.text;
    const map = result.outputFiles!.find((file) => file.path.endsWith('.map'))!.text;
    const line = code.split('\n').findIndex((text) => text.includes('= 42')) + 1;
    const column = code.split('\n')[line - 1].indexOf('42');
    const consumer = await new SourceMapConsumer(map);
    try {
      const location = consumer.originalPositionFor({ line, column });
      assert.equal(location.line, 3);
      assert.equal(location.column, 0);
      assert.equal(location.source?.replaceAll('\\', '/').split('/').pop(), 'original.ts');
    }
    finally {
      consumer.destroy();
    }
  });

  it('同一 Builder 连续重建三次，注册一次，每轮转换一次', async () => {
    const entry = join(root, 'entry.ts');
    const parent = new Builder({ root, logLevel: 'Silence' });
    let applies = 0;
    let registrations = 0;
    let transforms = 0;
    let beforeBundles = 0;
    builder = new Builder({
      root,
      entry,
      logLevel: 'Silence',
      typeCheck: false,
      plugins: [
        {
          name: 'count',
          apply(target) {
            applies++;
            target.hooks.beforeBundler.tap('count', () => {
              beforeBundles++;
            });
            target.hooks.afterInitialized.tap('count', () => {
              target.hooks.bundler.tap('count', (instance) => {
                registrations++;
                instance.hooks.transform.tap('count', (input) => {
                  transforms++;
                  return input;
                });
              });
            });
          },
        },
      ],
    }, parent);
    await builder.init();
    assert.equal(registrations, 1);
    assert.equal(transforms, 0);
    // 保留 context 以手动验证重建，测试不启动文件监听器或开发服务器。
    builder.options.watch = true;
    for (let i = 1; i <= 3; i++) {
      await writeFile(entry, `export default ${i};`);
      builder.setChangeFiles(entry);
      await builder.build();
      assert.deepEqual(builder.getErrors(), []);
    }
    assert.deepEqual({
      applies,
      registrations,
      transforms,
      beforeBundles,
    }, {
      applies: 1,
      registrations: 1,
      transforms: 3,
      beforeBundles: 3,
    });
  });

  it('真实 watcher 响应目录增删，失败后补回配置文件会自动恢复构建', async () => {
    const entry = join(root, 'entry.ts');
    const config = join(root, 'config.json');
    const pages = join(root, 'pages');
    await mkdir(pages);
    await writeFile(entry, 'export default 0;');
    const parent = new Builder({ root, logLevel: 'Silence' });
    builder = new Builder({
      root,
      entry,
      watch: true,
      logLevel: 'Silence',
      typeCheck: false,
      plugins: [
        {
          name: 'watch-extra',
          apply(target) {
            target.hooks.bundler.tap('watch-extra', (instance) => {
              instance.hooks.transform.tapPromise('watch-extra', async (input, ctx) => {
                ctx.addWatchFile(config);
                ctx.addWatchDir(pages);
                const offset = JSON.parse(await readFile(config, 'utf8'));
                const count = (await readdir(pages)).length;
                return ctx.update(input, { code: `export default { value: ${offset + count} };`, map: null });
              });
            });
          },
        },
      ],
    }, parent);
    const ready = new Promise<void>((resolve) => {
      builder.hooks.watcher.tap('test-ready', (watcher) => {
        watcher.once('ready', resolve);
      });
    });
    let value = -1;
    let changes = 0;
    builder.hooks.filesChange.tap('count-initial-events', () => {
      changes++;
    });
    builder.hooks.afterRunner.tap('capture', ({ runner }) => {
      value = runner.getOutput().value;
    });
    const nextSuccess = () => new Promise<void>((resolve) => {
      builder.hooks.success.tap('test-next', () => {
        resolve();
      });
    });
    const nextFailure = () => new Promise<void>((resolve) => {
      builder.hooks.failed.tap('test-next', () => {
        resolve();
      });
    });
    await builder.init();
    await builder.build();
    assert.match(builder.getErrors()[0].message, /ENOENT/);
    await ready;
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(changes, 0);
    let done = nextSuccess();
    await writeFile(config, '0');
    await done;
    assert.equal(value, 0);
    done = nextSuccess();
    await writeFile(join(pages, 'new.tsx'), 'a page');
    await done;
    assert.equal(value, 1);
    done = nextSuccess();
    await rm(join(pages, 'new.tsx'));
    await done;
    assert.equal(value, 0);
    done = nextFailure();
    await rm(config);
    await done;
    assert.match(builder.getErrors()[0].message, /ENOENT/);
    done = nextSuccess();
    await writeFile(config, '7');
    await done;
    assert.equal(value, 7);
    assert.deepEqual(builder.getErrors(), []);
  });

  it('外部 map 相对于 map 文件解析，登记依赖并支持后续转换', async () => {
    const entry = join(root, 'entry.js');
    const maps = join(root, 'maps');
    const mapPath = join(maps, 'entry.js.map');
    const original = 'export const value = 42;';
    await mkdir(maps);
    await writeFile(mapPath, JSON.stringify(mapLine('../original.ts', 2, 1, original)));
    await writeFile(entry, '\nexport const value = 42;\n//# sourceMappingURL=maps/entry.js.map');
    bundler.hooks.transform.tap('trim', (input, ctx) => ctx.update(input, {
      code: original, map: mapLine(entry, 1, 2, input.code),
    }));
    const result = await loadAndTransform(builder, bundler.hooks, args(entry), {});
    assert.ok(result?.watchFiles?.includes(mapPath));
    const encoded = (result!.contents as string).match(/base64,(.+)$/)![1];
    const consumer = await new SourceMapConsumer(Buffer.from(encoded, 'base64').toString('utf8'));
    try {
      const location = consumer.originalPositionFor({ line: 1, column: 0 });
      assert.match(location.source!, /\/original\.ts$/);
      assert.doesNotMatch(location.source!, /\/maps\//);
      assert.equal(location.line, 1);
      assert.equal(consumer.sourceContentFor(location.source!), original);
    }
    finally {
      consumer.destroy();
    }
  });
});
