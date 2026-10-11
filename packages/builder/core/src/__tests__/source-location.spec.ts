import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build, type BuildOptions } from 'esbuild';
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'mocha';
import { SourceMapConsumer } from 'source-map';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { loadAndTransform } from '../bundler/pipeline';
import { JssLoader } from '../plugins/jss-loader';
import { builderCache as jssCache } from '../plugins/jss-loader/store';
import { MdxLoader } from '../plugins/post-loader/mdx';
import { Resolver } from '../plugins/resolver';
import { getScriptBuilder } from '../plugins/script-loader/builder';
import { builderCache as scriptCache } from '../plugins/script-loader/utils';
import { SourceLocation } from '../plugins/source-location';
import { LanguageService } from '../plugins/type-checker/server/server';

function execute(code: string) {
  const module = { exports: {} as any };
  runInNewContext(code, { module, exports: module.exports, require });
  return JSON.parse(JSON.stringify(module.exports));
}

describe('构建期源文件位置', function () {
  this.timeout(15000);
  let root: string;
  let builder: Builder;
  let bundler: Bundler;
  const args = (path: string, namespace = 'file') => ({
    path,
    namespace,
    suffix: '',
    pluginData: undefined,
    with: {},
  });
  const bundle = (entry: string, options: BuildOptions = {}) => build(
    bundler.hooks.initialization.call({
      entryPoints: [entry],
      outfile: join(root, 'out.js'),
      bundle: true,
      write: false,
      platform: 'node',
      format: 'cjs',
      sourcemap: 'external',
      logLevel: 'silent',
      plugins: [BridgePlugin(bundler, builder)],
      ...options,
    }),
  );

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'blog-source-location-'));
    builder = new Builder({ root, logLevel: 'Silence', typeCheck: false });
    bundler = new Bundler(builder);
    Resolver().apply(builder);
    SourceLocation().apply(builder);
    MdxLoader().apply(builder);
    builder.hooks.bundler.call(bundler);
  });

  afterEach(async () => {
    await bundler.dispose();
    await builder.stop();
    for (const cache of [jssCache, scriptCache]) {
      for (const [key, child] of cache) {
        if (child.root === root) {
          cache.delete(key);
        }
      }
    }
    await rm(root, { recursive: true, force: true });
  });

  it('每个文件使用自己的路径，URL 正确编码空格、中文和百分号', async () => {
    const nested = join(root, '中文 空格 %');
    await mkdir(nested);
    const entry = join(root, 'index.ts');
    const child = join(nested, "quote's.ts");
    const code = 'export default { dir: __dirname, file: __filename, url: import.meta.url };';
    await writeFile(child, code);
    await writeFile(entry, `import child from ${JSON.stringify("./中文 空格 %/quote's")};\nmodule.exports = { child, dir: __dirname, file: __filename, url: import.meta.url };`);
    const result = execute((await bundle(entry)).outputFiles!.find((file) => file.path.endsWith('.js'))!.text);
    assert.deepEqual(result, {
      dir: root,
      file: entry,
      url: pathToFileURL(entry).href,
      child: {
        dir: nested,
        file: child,
        url: pathToFileURL(child).href,
      },
    });
  });

  it('文本宏跳过字符串、注释、正则、属性名和较长标识符，支持 JSX 表达式', async () => {
    const entry = join(root, 'scope.tsx');
    await writeFile(entry, `
      // __dirname __filename import.meta.url
      /* __dirname __filename import.meta.url */
      const text = '__dirname __filename import.meta.url';
      const obj = { __dirname: 'property', __filename: 'field' };
      const { __filename: renamed } = obj;
      const regex = /__dirname|__filename/;
      const __dirnameSuffix = 'long-name';
      const $__filename = 'dollar-name';
      const h = (name, props, children) => children;
      const jsx = <div __filename="attribute" baseDir={__dirname}>{__filename}</div>;
      module.exports = { text, prop: obj . __dirname, renamed, regex: regex.source,
        longer: __dirnameSuffix, dollar: $__filename, jsx, dir: true ? __dirname : '', url: import . meta . url,
        equal: __filename === 'other', computed: obj['__filename'] };
    `);
    const result = execute((await bundle(entry, { jsxFactory: 'h' })).outputFiles!.find((file) => file.path.endsWith('.js'))!.text);
    assert.deepEqual(result, {
      text: '__dirname __filename import.meta.url',
      prop: 'property',
      renamed: 'field',
      regex: '__dirname|__filename',
      longer: 'long-name',
      dollar: 'dollar-name',
      jsx: entry,
      dir: root,
      url: pathToFileURL(entry).href,
      equal: false,
      computed: 'field',
    });
  });

  it('没有待替换表达式时保留原字节；没有来源的虚拟模块保持原样', async () => {
    const entry = join(root, 'unchanged.ts');
    const code = '// __filename\nexport const text = "__dirname"; export const template = `__filename import.meta.url`;';
    await writeFile(entry, code);
    assert.equal((await loadAndTransform(builder, bundler.hooks, args(entry), {}))!.contents, code);
    bundler.hooks.load.tap('virtual', () => ({ contents: 'export default __filename;', loader: 'js' }));
    assert.equal((await loadAndTransform(builder, bundler.hooks, args('virtual', 'fixture'), {}))!.contents, 'export default __filename;');
  });

  it('MDX 编译成 JSX 后仍指向原 MDX 文件', async () => {
    const entry = join(root, 'post.mdx');
    await writeFile(entry, '---\ntitle: Paths\ncreate: 2026-01-01\nupdate: 2026-01-01\n---\n\nexport const location = [__dirname, __filename, import.meta.url];\n\n# Paths');
    const loaded = await loadAndTransform(builder, bundler.hooks, args(entry, 'mdx-loader'), {});
    assert.equal(loaded!.loader, 'jsx');
    assert.ok(String(loaded!.contents).includes(JSON.stringify(entry)));
    assert.ok(String(loaded!.contents).includes(JSON.stringify(pathToFileURL(entry).href)));
    const location = String(loaded!.contents).match(/export const location = (\[[^\n]+\]);/)![1];
    assert.deepEqual(JSON.parse(location), [root, entry, pathToFileURL(entry).href]);
  });

  it('MDX 中连续字体块的 JSX 结束标签不干扰路径替换', async () => {
    builder.options.mode = 'production';
    const entry = join(root, 'blocks.mdx');
    await writeFile(entry, [
      '---',
      'title: Font paths',
      'create: 2026-01-01',
      'update: 2026-01-01',
      '---',
      '',
      ...Array.from({ length: 3 }, () => '<FontBlock baseDir={__dirname} src="../../../fonts/font.ttf">\n文字\n</FontBlock>\n\n正文\n'),
      '<Spacer /><FontBlock baseDir={__dirname} src="./font.ttf" />',
    ].join('\n'));
    const loaded = await loadAndTransform(builder, bundler.hooks, args(entry, 'mdx-loader'), {});
    const code = String(loaded!.contents);
    const render = code.slice(code.indexOf('function _createMdxContent'));
    const directories = [...render.matchAll(/baseDir=\{([^}]+)\}/g)].map((match) => match[1]);
    assert.deepEqual(directories, Array(4).fill(JSON.stringify(root)));
  });

  it('替换后错误位置仍映射到原文件同一行、同一列', async () => {
    const entry = join(root, 'mapped.ts');
    const original = 'const file = __filename; throw new Error(file);\n';
    await writeFile(entry, original);
    const result = await bundle(entry);
    const code = result.outputFiles!.find((file) => file.path.endsWith('.js'))!.text;
    const beforeThrow = code.slice(0, code.indexOf('throw new Error'));
    const mapFile = result.outputFiles!.find((file) => file.path.endsWith('.map'))!;
    const map = await new SourceMapConsumer(mapFile.text);
    try {
      const position = map.originalPositionFor({
        line: beforeThrow.split('\n').length,
        column: beforeThrow.length - beforeThrow.lastIndexOf('\n') - 1,
      });
      const originalURL = new URL(position.source!, pathToFileURL(mapFile.path)).href;
      assert.equal(originalURL, pathToFileURL(entry).href);
      assert.equal(position.line, 1);
      assert.equal(position.column, original.indexOf('throw'));
    }
    finally {
      map.destroy();
    }
  });

  it('默认安装于 Node 子构建及 JSS，运行器拿到真实源位置', async () => {
    const entry = join(root, 'render.ts');
    const style = join(root, 'theme.jss.ts');
    await writeFile(style, 'export default { classes: { source: __filename }, toString() { return ""; } };');
    await writeFile(entry, 'import style from "./theme.jss"; export default { path: __filename, dir: __dirname, url: import.meta.url, sibling: new URL("./side.txt", import.meta.url).href, style: style.classes.source };');
    const child = await builder.createChild({
      entry, plugins: [JssLoader({ extractAsset: false })],
    });
    let result: any;
    child.hooks.afterRunner.tap('capture', ({ runner }) => {
      result = runner.getOutput();
    });
    await child.build();
    assert.deepEqual(child.getErrors(), []);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), {
      path: entry,
      dir: root,
      url: pathToFileURL(entry).href,
      sibling: pathToFileURL(join(root, 'side.txt')).href,
      style,
    });
  });

  it('构建器的类型检查接受 import.meta.url，不需要放宽诊断过滤', async () => {
    await writeFile(join(root, 'entry.ts'), 'export const url: string = new URL("./file", import.meta.url).href;');
    await writeFile(join(root, 'tsconfig.json'), JSON.stringify({
      files: [join(root, 'entry.ts')], compilerOptions: { strict: true, types: [] },
    }));
    const server = new LanguageService({
      // 与实际构建一致，从 core 查找 TypeScript 标准库。
      basePath: join(__dirname, '../..'),
      configFile: join(root, 'tsconfig.json'),
      configOverwrite: {},
      typescriptPath: require.resolve('typescript'),
    });
    try {
      assert.deepEqual(server.getDiagnostics(), []);
    }
    finally {
      server.dispose();
    }
  });

  it('浏览器构建及父级的 script 入口均不注入磁盘路径', async () => {
    const entry = join(root, 'browser.script.ts');
    const dependency = join(root, 'browser.ts');
    await writeFile(dependency, 'export const url = import.meta.url; export const dir = typeof __dirname;');
    const code = 'import { url, dir } from "./browser"; console.log(import.meta.url, __filename, url, dir);';
    await writeFile(entry, code);
    assert.equal((await loadAndTransform(builder, bundler.hooks, args(entry), {}))!.contents, code);
    const output = (await bundle(dependency, { platform: 'browser', format: 'esm' })).outputFiles!.find((file) => file.path.endsWith('.js'))!.text;
    assert.match(output, /import\.meta\.url/);
    assert.doesNotMatch(output, /file:\/\//);
    builder.renameAsset = ({ path }) => path;
    const script = await getScriptBuilder(entry, builder);
    assert.deepEqual(script.getErrors(), []);
    assert.doesNotMatch(script.getAssets().find((asset) => asset.path.endsWith('.js'))!.content.toString(), /file:\/\//);
  });
});
