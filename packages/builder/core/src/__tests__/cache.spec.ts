import { expect, describe, it } from '@blog/test-toolkit';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { CacheController } from '../plugins/cache';

describe('CacheController', () => {
  let tmpDir: string;

  function setup() {
    tmpDir = mkdtempSync(join(tmpdir(), 'blog-cache-test-'));
    const builder = {
      root: tmpDir,
      options: { cache: '.cache' },
      getCacheAccessor: () => {
        throw new Error('not initialized');
      },
    };
    CacheController().apply(builder as any);

    return {
      tmpDir,
      accessor: (builder as any).getCacheAccessor('test-cache'),
    };
  }

  it('getCacheAccessor 被正确注入', () => {
    const { accessor } = setup();
    expect(accessor).not.undefined;
  });

  it('accessor.path 返回正确的缓存路径', () => {
    const { accessor, tmpDir } = setup();
    const expected = join(tmpDir, '.cache', 'test-cache');
    expect(accessor.path).eq(expected.replace(/\\/g, '/'));
  });

  it('write 创建目录并写入文件，read 可读取', async () => {
    const { accessor } = setup();

    const content = Buffer.from('cached data');
    await accessor.write('key1', content);

    const result = await accessor.read('key1');
    expect(result).not.undefined;
    expect(result!.toString()).eq('cached data');
  });

  it('read 不存在的文件返回 undefined', async () => {
    const { accessor } = setup();

    const result = await accessor.read('nonexistent');
    expect(result).undefined;
  });

  it('不同 name 的缓存读写隔离', async () => {
    const builder = {
      root: tmpDir,
      options: { cache: '.cache' },
      getCacheAccessor: () => {
        throw new Error('not initialized');
      },
    };
    CacheController().apply(builder as any);

    const a = (builder as any).getCacheAccessor('ns-a');
    const b = (builder as any).getCacheAccessor('ns-b');

    await a.write('key', Buffer.from('a-value'));
    await b.write('key', Buffer.from('b-value'));

    expect((await a.read('key'))!.toString()).eq('a-value');
    expect((await b.read('key'))!.toString()).eq('b-value');
  });

  // 清理
  afterEach(() => {
    if (tmpDir) {
      try {
        rmSync(tmpDir, { recursive: true, force: true });
      } catch (_) {
        //
      }
    }
  });
});
