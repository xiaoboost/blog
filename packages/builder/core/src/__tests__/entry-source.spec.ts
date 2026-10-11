import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';
import { describe, it } from 'mocha';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { loadAndTransform } from '../bundler/pipeline';
import { JssLoader } from '../plugins/jss-loader';
import { builderCache as jssCache, cssCodeCache } from '../plugins/jss-loader/store';
import { ScriptLoader } from '../plugins/script-loader';
import { builderCache as scriptCache } from '../plugins/script-loader/utils';

describe('子构建入口源码传递', () => {
  for (const kind of ['script', 'jss'] as const) {
    it(`${kind} 使用前序转换的源码、解析目录与映射，输入改变才重建`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'blog-entry-source-'));
      const entry = normalize(join(root, `entry.${kind}.ts`));
      const resolveDir = join(root, 'dependencies');
      const dependency = join(resolveDir, 'value.ts');
      const original = 'export default "DISK_SOURCE";';
      const parent = new Builder({
        root,
        mode: 'development',
        logLevel: 'Silence',
        typeCheck: false,
      });
      const bundler = new Bundler(parent);
      const createChild = parent.createChild.bind(parent);
      const cache = kind === 'script' ? scriptCache : jssCache;
      let child: BuilderInstance | undefined;
      let builds = 0;
      let parentTransforms = 0;
      let marker = 'FIRST';
      let sourceMap = '';

      parent.renameAsset = ({ path }) => `/${basename(path)}`;
      parent.createChild = async (options) => {
        child = await createChild(options);
        // 保留增量构建上下文，通过手动通知隔离真实 watcher 时序。
        child.options.watch = true;
        child.hooks.afterBundler.tap('capture-entry-source', ({ bundler }) => {
          builds++;
          sourceMap = bundler.getBundledCode().sourceMap!;
        });
        return child;
      };
      (kind === 'script' ? ScriptLoader() : JssLoader()).apply(parent);
      parent.hooks.bundler.call(bundler);
      bundler.hooks.transform.tap({ name: 'parent-source', stage: -100 }, (input, ctx) => {
        parentTransforms++;
        assert.equal(input.code, original, '每次从入口原文开始，不继承父管道到子构建');
        const body = kind === 'script'
          ? `console.log('${marker}', value); const assets = []; export default assets;`
          : `export default { classes: { marker: '${marker}' }, toString() { return '.${marker} { color: ' + value + '; }'; } };`;
        return ctx.update(input, {
          code: `import value from './value';\n${body}`,
          format: 'js',
          resolveDir,
          map: {
            version: 3,
            sources: [entry],
            sourcesContent: [original],
            names: [],
            mappings: ';AAAA',
          },
        });
      });
      const load = () => loadAndTransform(parent, bundler.hooks, {
        path: entry,
        namespace: 'file',
        suffix: '',
        pluginData: undefined,
        with: {},
      }, {});
      const output = () => child!.getAssets()
        .find((asset) => asset.path.endsWith(kind === 'script' ? '.js' : '.css'))!.content.toString();

      try {
        await mkdir(resolveDir);
        await writeFile(entry, original);
        await writeFile(dependency, 'export default "red";');
        const wrapper = await load();
        assert.deepEqual(child!.getErrors(), []);
        assert.equal(wrapper!.loader, 'js');
        assert.match(output(), /FIRST/);
        assert.match(output(), /red/);
        assert.ok(JSON.parse(sourceMap).sourcesContent.includes(original), '前序 source map 到达子构建产物');
        assert.equal(builds, 1);

        marker = 'SECOND';
        await load();
        assert.equal(builds, 2, '磁盘不变，传入源码改变也会重建');
        assert.match(output(), /SECOND/);
        assert.doesNotMatch(output(), /FIRST/);

        await load();
        assert.equal(builds, 2, '内容与映射相同，沿用已有产物');

        assert.equal(parentTransforms, 3);
        assert.deepEqual(child!.getErrors(), []);
      }
      finally {
        await bundler.dispose();
        await parent.stop();
        for (const [key, value] of cache) {
          if (value === child) {
            cache.delete(key);
          }
        }
        cssCodeCache.delete(entry.replace(/\.ts$/, '.css'));
        await rm(root, { recursive: true, force: true });
      }
    });
  }
});
