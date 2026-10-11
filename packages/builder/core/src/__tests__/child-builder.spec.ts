import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { normalize } from '@blog/node';
import type { BuilderInstance, BuilderPlugin } from '@blog/types';
import { describe, it } from 'mocha';
import { Builder } from '../builder';
import { getJssBuilder } from '../plugins/jss-loader/builder';
import { builderCache as jssCache } from '../plugins/jss-loader/store';
import { getScriptBuilder } from '../plugins/script-loader/builder';
import { builderCache as scriptCache } from '../plugins/script-loader/utils';

describe('子构建进行中的资源读取', () => {
  for (const kind of ['script', 'jss'] as const) {
    it(`${kind} 在子构建转换源码，资源读取等待新产物`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'blog-child-build-'));
      const entry = join(root, `entry.${kind}.ts`);
      const parent = new Builder({ root, logLevel: 'Silence', typeCheck: false });
      const createChild = parent.createChild.bind(parent);
      let transforms = 0;
      const sourceTransform: BuilderPlugin = {
        name: 'fixture-source-transform',
        apply(child) {
          child.hooks.bundler.tap('fixture-source-transform', (bundler) => {
            bundler.hooks.transform.tap(
              { name: 'fixture-source-transform', stage: -100 },
              (input, ctx) => {
                const sourcePath = input.module.sourcePath;

                if (!sourcePath || normalize(sourcePath) !== normalize(entry)) {
                  return input;
                }

                transforms++;
                return ctx.update(input, { code: input.code.replace('blue', 'royalblue'), map: 'identity' });
              },
            );
          });
        },
      };
      // 保留 esbuild context，使用手动变更隔离真实 watcher 的事件时序。
      parent.createChild = async (options) => {
        const child = await createChild({
          ...options,
          plugins: [...(options?.plugins ?? []), sourceTransform],
        });
        child.options.watch = true;
        return child;
      };
      parent.renameAsset = ({ path }) => `/${basename(path)}`;
      const factory = kind === 'script' ? getScriptBuilder : getJssBuilder;
      const cache = kind === 'script' ? scriptCache : jssCache;
      const styles = resolve(__dirname, '../../../../utils/styles/src/compile').replaceAll('\\', '/');
      const source = (marker: string) => kind === 'script'
        ? `console.log('${marker}'); const assets: string[] = []; export default assets;`
        : `import { createStyles } from '${styles}'; export default createStyles({ marker: { color: '${marker}' } });`;
      let child: BuilderInstance | undefined;
      let release: (() => void) | undefined;
      let rebuilding: Promise<void> | undefined;
      let reading: Promise<BuilderInstance> | undefined;
      try {
        await writeFile(entry, source('red'));
        child = await factory(entry, parent);
        child.addWatchFiles(entry);
        const paused = new Promise<void>((resolve) => {
          child!.hooks.beforeBundler.tapPromise('pause-rebuild', () => new Promise<void>((resume) => {
            release = resume;
            resolve();
          }));
        });
        await writeFile(entry, source('blue'));
        child.setChangeFiles(entry);
        rebuilding = child.build();
        await paused;
        assert.equal(child.shouldBuild, false);

        let settled = false;
        reading = factory(entry, parent).then((value) => {
          settled = true;
          return value;
        });
        await new Promise((resolve) => setTimeout(resolve, 25));
        assert.equal(settled, false, '不能在子构建尚未结束时返回旧资源');
        release!();
        await Promise.all([rebuilding, reading]);
        const output = child.getAssets().find((file) => file.path.endsWith(kind === 'script' ? '.js' : '.css'));
        assert.ok(output);
        assert.match(output.content.toString(), /royalblue/);
        assert.equal(transforms, 2, '首次构建和重建各转换一次，无需跨构建继承或跳过');
      }
      finally {
        release?.();
        await Promise.allSettled([rebuilding, reading]);
        await parent.stop();
        for (const [key, value] of cache) {
          if (value === child) {
            cache.delete(key);
          }
        }
        await rm(root, { recursive: true, force: true });
      }
    });
  }
});
