import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalize } from '@blog/node';
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'mocha';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { loadAndTransform } from '../bundler/pipeline';
import { PostLoader } from '../plugins/post-loader';

describe('Slide 自动资源入口', () => {
  let root: string;
  let builder: Builder;
  let bundler: Bundler;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'blog-slide-assets-'));
    builder = new Builder({ root, logLevel: 'Silence', typeCheck: false });
    bundler = new Bundler(builder);
    PostLoader().apply(builder);
    builder.hooks.bundler.call(bundler);
  });

  afterEach(async () => {
    await bundler.dispose();
    await builder.stop();
    await rm(root, { recursive: true, force: true });
  });

  async function compile(template: string, body = '# 正文') {
    const path = normalize(join(root, 'index.mdx'));
    await writeFile(path, `---\ntitle: 样例\ncreate: 2026-01-01\nupdate: 2026-01-02\ntemplate: ${template}\n---\n\n${body}`);
    const result = await loadAndTransform(builder, bundler.hooks, {
      path,
      namespace: 'mdx-loader',
      suffix: '',
      pluginData: undefined,
      with: {},
    }, {});
    assert.equal(result?.loader, 'jsx');
    return result!.contents as string;
  }

  it('在 MDX 编译前注入公共 glob 导入，并合并进 utils', async () => {
    const code = await compile('slide');
    assert.match(code, /import __slideAssets from ["']assets:\.\/\*\*\/\*\.\{script,jss\}\.ts["']/);
    assert.match(code, /defineUtils\(__slideAssets\)/);
    assert.match(code, /样例/);
    assert.match(code, /正文/);
    assert.equal(await compile('slide'), code, '缓存命中时不重复注入');
  });

  it('普通文章不自动扫描，但可以手写公共 assets: 导入', async () => {
    assert.doesNotMatch(await compile('post'), /assets:/);
    const code = await compile('post', "import pageAssets from 'assets:./styles/*.jss.ts';\n\n# 正文");
    assert.match(code, /defineUtils\(pageAssets\)/);
    assert.doesNotMatch(code, /__slideAssets/);
  });

  it('生成的绑定避开作者已有变量，代码块中的相同文本不影响正文', async () => {
    const code = await compile('slide', 'export const __slideAssets = 42;\n\n```ts\nconst example = "assets:";\n```');
    assert.match(code, /defineUtils\(__slideAssets_\)/);
    assert.match(code, /const __slideAssets = 42/);
  });
});
