import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { expect, describe, it } from '@blog/test-toolkit';
import { parsePath, createResolver } from '../utils/resolve';

describe('parsePath', () => {
  it('无 query 的路径', () => {
    const result = parsePath('/path/to/file.ts');
    expect(result.original).eq('/path/to/file.ts');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).undefined;
    expect(result.query).deep.eq({});
  });

  it('带单个 query 参数', () => {
    const result = parsePath('/path/to/file.ts?raw');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).eq('raw');
    expect(result.query).deep.eq({ raw: true });
  });

  it('带多个 query 参数', () => {
    const result = parsePath('/path/to/file.ts?a=1&b=hello');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).eq('a=1&b=hello');
    expect(result.query).deep.eq({ a: '1', b: 'hello' });
  });
});

describe('createResolver', () => {
  it('同一 importer 切换 resolveDir 不复用另一个目录的缓存', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-resolve-dir-'));

    try {
      const resolve = createResolver({ root });
      const importer = join(root, 'index.mdx');

      for (const name of ['one', 'two']) {
        const resolveDir = join(root, name);
        await mkdir(resolveDir);
        await writeFile(join(resolveDir, 'font.ttf'), name);
        expect(normalize(resolve('./font.ttf', { importer, resolveDir }).path))
          .eq(join(resolveDir, 'font.ttf'));
      }
    }
    finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('URL 被标记为 external', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('https://example.com/style.css');
    expect(result.external).true;
    expect(result.path).eq('https://example.com/style.css');
  });

  it('node 内置模块被标记为 external', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('fs');
    expect(result.external).true;
    expect(result.path).eq('fs');
  });

  it('自定义 external 包列表', () => {
    const resolve = createResolver({ root: '/', external: ['react', 'vue'] });
    expect(resolve('react').external).true;
    expect(resolve('vue').external).true;
    // 不在列表中的普通 npm 包尝试解析会失败，这是预期行为
  });

  it('带 query 的 URL 保留 suffix', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('https://example.com/font.woff?raw');
    expect(result.external).true;
    expect(result.suffix).eq('raw');
  });
});
