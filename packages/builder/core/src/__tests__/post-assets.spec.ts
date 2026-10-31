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
      suffix: resolved!.suffix ?? '',
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

  for (const mode of ['development', 'production'] as const) {
    it(`${mode} 按 outDir 输出 CSS/JS，无参数入口仍使用公共目录`, async () => {
      parent.options.mode = mode;
      await write('theme.jss.ts', jss('article'));
      await write('interaction.script.ts', 'globalThis.ready = true;');
      const scoped = await load('assets:./**/*.{script,jss}.ts?outDir=/posts/example/');
      assert.equal(scoped.paths.length, 2);
      assert.ok(scoped.paths.some((path) => path.startsWith('/posts/example/styles/')));
      assert.ok(scoped.paths.some((path) => mode === 'production'
        ? /^\/posts\/example\/styles\/styles\.[a-f0-9]{32}\.css$/.test(path)
        : path === '/posts/example/styles/styles.css'));
      assert.ok(scoped.paths.some((path) => path.startsWith('/posts/example/scripts/')));

      if (mode === 'production') {
        assert.ok(scoped.paths.every((path) => /\.[a-f0-9]{32}\.(css|js)$/.test(path)));
      }

      const shared = await load();
      assert.ok(shared.paths.some((path) => path.startsWith('/styles/')));
      assert.ok(shared.paths.some((path) => path.startsWith('/scripts/')));
      assert.equal(shared.css, scoped.css);
      // 此测试不创建 MDX 文件：assets 协议不应读取或解析文章。
    });
  }

  it('同一 glob 指定不同目录时独立输出，并保留 glob 的问号通配符', async () => {
    await write('item1.jss.ts', jss('article'));
    const first = await load('assets:./item?.jss.ts?outDir=/posts/first/');
    const second = await load('assets:./item?.jss.ts?outDir=/posts/second/');
    assert.match(first.css, /\.article/);
    assert.equal(first.css, second.css);
    assert.ok(first.paths.every((path) => path.startsWith('/posts/first/styles/')));
    assert.ok(second.paths.every((path) => path.startsWith('/posts/second/styles/')));
    assert.notDeepEqual(first.paths, second.paths);
  });

  it('部署子目录和包含中文、空格、加号的输出目录可以正确组合', async () => {
    parent.options.publicPath = '/blog/';
    await write('theme.jss.ts', jss('article'));
    const outDir = '/posts/中文 空格+&/';
    const result = await load(`assets:./*.jss.ts?outDir=${encodeURIComponent(outDir)}`);
    assert.equal(result.paths.length, 1);
    assert.ok(result.paths[0].startsWith(`/blog${outDir}styles/`));
  });

  it('拒绝越出站点的输出目录和错误编码', async () => {
    for (const outDir of [
      '../outside',
      '/posts/../outside',
      'C:/outside',
      'https://example.com',
    ]) {
      await assert.rejects(load(`assets:./*.jss.ts?outDir=${encodeURIComponent(outDir)}`), /outDir/);
    }
    await assert.rejects(load('assets:./*.jss.ts?outDir=%ZZ'), URIError);
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
