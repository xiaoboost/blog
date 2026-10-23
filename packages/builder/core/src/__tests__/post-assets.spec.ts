import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'mocha';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { loadAndTransform } from '../bundler/pipeline';
import { builderCache as jssCache, cssCodeCache } from '../plugins/jss-loader/store';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { PostLoader } from '../plugins/post-loader';
import { postAssetsNamespace } from '../plugins/post-loader/assets';
import { ScriptLoader } from '../plugins/script-loader';
import { builderCache as scriptCache } from '../plugins/script-loader/utils';

describe('PostLoader 的 assets: 资源入口', function () {
  this.timeout(20000);
  let root: string;
  let parent: Builder;
  let bundler: Bundler;
  let children: BuilderInstance[];

  beforeEach(async () => {
    // 系统临时目录可能带有 glob 元字符；这里专门验证文章内的资源匹配。
    const fixturesDir = join(__dirname, '../../.cache');
    await mkdir(fixturesDir, { recursive: true });
    root = normalize(await mkdtemp(join(fixturesDir, 'blog-assets-')));
    parent = new Builder({
      root,
      mode: 'development',
      logLevel: 'Silence',
      typeCheck: false,
    });
    bundler = new Bundler(parent);
    children = [];
    const createChild = parent.createChild.bind(parent);
    parent.createChild = async (options) => {
      const child = await createChild(options);
      // 手动发送文件变化，保留增量构建上下文但不启动真实 watcher。
      child.options.watch = true;
      children.push(child);
      return child;
    };
    parent.renameAsset = ({ path }) => `/${basename(path)}`;
    LocalPackageRequirer().apply(parent);
    PostLoader().apply(parent);
    ScriptLoader().apply(parent);
    parent.hooks.bundler.call(bundler);
  });

  afterEach(async () => {
    await bundler.dispose();
    await parent.stop();
    for (const cache of [scriptCache, jssCache]) {
      for (const [key, child] of cache) {
        if (normalize(child.options.entry).startsWith(`${root}/`)) {
          cache.delete(key);
        }
      }
    }
    for (const key of cssCodeCache.keys()) {
      if (normalize(key).startsWith(`${root}/`)) {
        cssCodeCache.delete(key);
      }
    }
    await rm(root, { recursive: true, force: true });
  });

  async function write(path: string, content: string) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
    return normalize(file);
  }

  const jss = (name: string, color = 'red') => `export default {
    classes: { page: '${name}' },
    toString() { return '.${name} { color: ${color}; }'; },
  };`;

  async function load(request = 'assets:./**/*.{script,jss}.ts', directory = root) {
    const resolved = await bundler.hooks.resolve.promise({
      path: request,
      importer: join(directory, 'index.mdx'),
      resolveDir: directory,
      namespace: 'mdx-loader',
      kind: 'import-statement',
      pluginData: undefined,
      with: {},
    });
    assert.equal(resolved?.namespace, postAssetsNamespace);
    const result = await loadAndTransform(parent, bundler.hooks, {
      path: resolved!.path!,
      namespace: resolved!.namespace!,
      suffix: '',
      pluginData: resolved!.pluginData,
      with: {},
    }, {});
    assert.deepEqual(parent.getErrors(), []);
    assert.equal(result?.loader, 'js');
    const expression = (result!.contents as string).replace(/^export default /, '');
    const paths = Array.from<string>(runInNewContext(expression));
    const assets = paths.map((path) => {
      const asset = children
        .flatMap((child) => child.getAssets())
        .find((asset) => asset.path === path);
      assert.ok(asset, `导出的资源必须实际存在：${path}`);
      return asset;
    });
    return {
      ...result,
      paths,
      css: assets.filter((asset) => asset.path.endsWith('.css')).map((asset) => asset.content.toString()).join('\n'),
      js: assets.filter((asset) => asset.path.endsWith('.js')).map((asset) => asset.content.toString()).join('\n'),
    };
  }

  it('递归收集脚本与样式，脚本内仍可正常导入同一个 JSS', async () => {
    await write('pages/中文 空格/theme.jss.ts', jss('theme'));
    await write('interaction.script.ts', [
      "import style from './pages/中文 空格/theme.jss';",
      'globalThis.loadedClass = style.classes.page;',
      'const assets = []; export default assets;',
    ].join('\n'));
    await write('unused.ts', 'throw new Error("不应该执行普通辅助文件");');
    const result = await load();
    assert.match(result.css, /\.theme/);
    assert.match(result.css, /color: red/);
    const browser: Record<string, unknown> = {};
    runInNewContext(result.js, browser);
    assert.equal(browser.loadedClass, 'theme');
    assert.ok(result.watchDirs?.includes(root));
    assert.ok(result.watchFiles?.includes(normalize(join(root, 'interaction.script.ts'))));
  });

  it('匹配范围由 glob 决定，空匹配导出空列表', async () => {
    await write('theme.jss.ts', jss('root'));
    await write('pages/theme.jss.ts', jss('nested'));
    await write('interaction.script.ts', 'globalThis.unwanted = true;');
    const result = await load('assets:./*.jss.ts');
    assert.match(result.css, /\.root/);
    assert.doesNotMatch(result.css, /\.nested/);
    assert.equal(result.js, '');
    assert.deepEqual((await load('assets:./missing/**/*.jss.ts')).paths, []);
  });

  it('相同 glob 相对于各自文章目录解析，资源互不混入', async () => {
    await write('first/theme.jss.ts', jss('first'));
    await write('second/theme.jss.ts', jss('second'));
    const first = await load('assets:./*.jss.ts', join(root, 'first'));
    const second = await load('assets:./*.jss.ts', join(root, 'second'));
    assert.match(first.css, /\.first/);
    assert.doesNotMatch(first.css, /\.second/);
    assert.match(second.css, /\.second/);
    assert.doesNotMatch(second.css, /\.first/);
    assert.notDeepEqual(first.paths, second.paths);
  });

  it('不改 MDX，新增、修改、删除匹配文件后更新资源内容', async () => {
    await write('base.jss.ts', jss('base'));
    await load();
    const added = await write('pages/new.jss.ts', jss('added'));
    parent.setChangeFiles(added);
    assert.match((await load()).css, /\.added/);
    await write('pages/new.jss.ts', jss('added', 'blue'));
    parent.setChangeFiles(added);
    assert.match((await load()).css, /color: blue/);
    await rm(added);
    parent.setChangeFiles(added);
    const result = await load();
    assert.match(result.css, /\.base/);
    assert.doesNotMatch(result.css, /\.added/);
  });

  it('删除最后一个样式文件后，不再导出旧样式资源', async () => {
    const style = await write('theme.jss.ts', jss('removed'));
    await write('interaction.script.ts', 'globalThis.ready = true;');
    assert.match((await load()).css, /\.removed/);
    await rm(style);
    parent.setChangeFiles(style);
    const result = await load();
    assert.equal(result.css, '');
    assert.ok(result.paths.some((path) => path.endsWith('.js')));
  });
});
