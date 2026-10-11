import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { transform } from '@blog/parser';
import {
  context,
  type BuildOptions,
  type BuildResult,
  type Plugin,
} from 'esbuild';
import { describe, it } from 'mocha';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { MdxLoader } from '../plugins/post-loader/mdx';
import { Resolver } from '../plugins/resolver';
import { Transformer } from '../plugins/script-loader/builder/transformer';

function sameBytes(before: BuildResult, after: BuildResult) {
  assert.deepEqual(
    before.outputFiles!.map((file) => file.path),
    after.outputFiles!.map((file) => file.path),
  );
  for (let i = 0; i < before.outputFiles!.length; i++) {
    const left = Buffer.from(before.outputFiles![i].contents);
    const right = Buffer.from(after.outputFiles![i].contents);
    assert.ok(left.equals(right), before.outputFiles![i].path);
  }
}

describe('Transform 迁移的增量产物', function () {
  this.timeout(15000);

  for (const mode of ['production', 'development'] as const) {
    for (const source of ['mdx', 'script'] as const) {
      it(`${mode} ${source}：三次 rebuild 的 JS 和 map 与旧 load 路径逐字节相同`, async () => {
        const root = await mkdtemp(join(tmpdir(), 'blog-transform-parity-'));
        const entry = join(root, source === 'mdx' ? 'post.mdx' : 'index.script.ts');
        const builder = new Builder({
          root,
          mode,
          logLevel: 'Silence',
          typeCheck: false,
        });
        const bundler = new Bundler(builder);
        Resolver().apply(builder);
        (source === 'mdx' ? MdxLoader() : Transformer()).apply(builder);
        builder.hooks.bundler.call(bundler);
        const options: BuildOptions = {
          entryPoints: [entry],
          outfile: join(root, 'out.js'),
          bundle: true,
          write: false,
          sourcemap: 'external',
          logLevel: 'silent',
          charset: 'utf8',
          format: source === 'script' ? 'iife' : 'cjs',
          platform: source === 'script' ? 'browser' : 'node',
          minify: source === 'script' && mode === 'production',
        };
        const external: Plugin = {
          name: 'external-packages',
          setup(build) {
            build.onResolve({ filter: /^(@blog\/|react\/)/ }, (args) => ({
              path: args.path, external: true,
            }));
          },
        };
        let expectedScript = '';
        // 对照旧流程：MDX 在 load 中编译；script 的 load 提供旧替换后的源码。
        const legacy: Plugin = {
          name: 'legacy-load',
          setup(build) {
            if (source === 'mdx') {
              build.onResolve({ filter: /\.mdx$/ }, (args) => ({
                path: args.path.replaceAll('\\', '/'), namespace: 'mdx-loader', sideEffects: false,
              }));
              build.onLoad({ filter: /.*/, namespace: 'mdx-loader' }, async (args) => ({
                contents: await transform(await readFile(args.path, 'utf8'), args.path, mode === 'development'),
                loader: 'jsx',
                resolveDir: dirname(args.path),
                watchFiles: [args.path],
              }));
            }
            else {
              build.onLoad({ filter: /\.script\.ts$/ }, () => ({
                contents: expectedScript, loader: 'ts', resolveDir: root,
              }));
            }
          },
        };
        const before = await context({ ...options, plugins: [external, legacy] });
        const after = await context({
          ...options,
          plugins: [external, BridgePlugin(bundler, builder)],
        });
        try {
          for (const value of [1, 42, 3]) {
            const script = `const assets = [];\nexport default assets;\nconsole.log(${value});`;
            expectedScript = `const assets = [];\n                      \nconsole.log(${value});`;
            await writeFile(entry, source === 'mdx'
              ? `---\ntitle: 字节一致\ncreate: 2026-01-01\nupdate: 2026-01-02\n---\n\n# 第 ${value} 次构建`
              : script);
            sameBytes(await before.rebuild(), await after.rebuild());
          }
        }
        finally {
          await before.dispose();
          await after.dispose();
          await builder.stop();
          await rm(root, { recursive: true, force: true });
        }
      });
    }
  }
});
