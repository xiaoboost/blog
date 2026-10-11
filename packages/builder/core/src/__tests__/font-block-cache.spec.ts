import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import {
  afterEach,
  before,
  beforeEach,
  describe,
  it,
} from 'mocha';

describe('FontBlock 原始字体缓存', () => {
  const fontRoot = resolve(__dirname, '../../../../components/font-block');
  const fontRequire = createRequire(join(fontRoot, 'package.json'));
  let code: string;
  let root: string;
  let file: string;
  let cache: Map<string, unknown>;
  let reads: number;
  let stats: number;
  let failRead: boolean;

  // 每轮重新执行模块，共享 getAccessor 内存，模拟真实构建运行器的生命周期。
  function nextBuild(): (src: string) => Promise<Buffer> {
    const module = { exports: {} as any };
    runInNewContext(code, {
      module,
      exports: module.exports,
      require(name: string) {
        if (name === '@blog/context/runtime') {
          return { getAccessor: () => ({ get: () => cache }) };
        }

        if (name === 'fs/promises') {
          return {
            stat(path: string) {
              stats++;
              return fs.stat(path);
            },
            readFile(path: string) {
              reads++;
              return failRead ? Promise.reject(new Error('read failed')) : fs.readFile(path);
            },
          };
        }

        return fontRequire(name);
      },
    });
    return module.exports.getFontContentBySrc;
  }

  before(async () => {
    const result = await build({
      entryPoints: [join(fontRoot, 'src/utils.ts')],
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'cjs',
      write: false,
    });
    code = result.outputFiles![0].text;
  });

  beforeEach(async () => {
    root = await fs.mkdtemp(join(tmpdir(), 'blog-font-cache-'));
    file = join(root, 'font.ttf');
    cache = new Map();
    reads = 0;
    stats = 0;
    failRead = false;
    await fs.writeFile(file, 'AAAA');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('同轮并发只检查、读取一次；跨轮未变化复用同一个 Buffer', async () => {
    const get = nextBuild();
    const first = get(file);
    assert.equal(get(file), first);
    const content = await first;
    assert.equal(await get(file), content);
    assert.equal(stats, 1);
    assert.equal(reads, 1);

    assert.equal(await nextBuild()(file), content);
    assert.equal(stats, 2);
    assert.equal(reads, 1);
  });

  it('同大小文件内容修改后重新读取，其他轮次继续复用', async () => {
    const original = await nextBuild()(file);
    const info = await fs.stat(file);
    await fs.writeFile(file, 'BBBB');
    await fs.utimes(file, info.atime, new Date(info.mtimeMs + 1000));
    const changed = await nextBuild()(file);
    assert.equal(changed.toString(), 'BBBB');
    assert.notEqual(changed, original);
    assert.equal(await nextBuild()(file), changed);
    assert.equal(reads, 2);
  });

  it('字体删除会报错，重新创建后可以读取新内容', async () => {
    await nextBuild()(file);
    await fs.rm(file);
    await assert.rejects(nextBuild()(file), { code: 'ENOENT' });
    await fs.writeFile(file, 'CCCC');
    assert.equal((await nextBuild()(file)).toString(), 'CCCC');
    assert.equal(reads, 2);
  });

  it('读取失败的 Promise 不会跨轮缓存', async () => {
    failRead = true;
    await assert.rejects(nextBuild()(file), /read failed/);
    failRead = false;
    assert.equal((await nextBuild()(file)).toString(), 'AAAA');
    assert.equal(reads, 2);
  });
});
