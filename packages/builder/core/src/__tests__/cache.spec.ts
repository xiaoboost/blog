import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { expect, describe, it } from '@blog/test-toolkit';
import type { CacheAccessor } from '@blog/types';
import { afterEach, beforeEach } from 'mocha';
import { CacheController } from '../plugins/cache';

describe('CacheController', () => {
  let tmpDir: string;
  let accessor: (name: string) => CacheAccessor;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'blog-cache-test-'));
    const builder = {
      root: tmpDir,
      options: { cache: '.cache' },
      getCacheAccessor: () => {
        throw new Error('not initialized');
      },
    };
    CacheController().apply(builder as any);
    accessor = builder.getCacheAccessor;
  });

  it('write 创建目录并写入文件，read 可读取', async () => {
    const cache = accessor('test-cache');

    const content = Buffer.from('cached data');
    await cache.write('key1', content);

    const result = await cache.read('key1');
    expect(result).not.undefined;
    expect(result!.toString()).eq('cached data');
  });

  it('read 不存在的文件返回 undefined', async () => {
    const result = await accessor('test-cache').read('nonexistent');
    expect(result).undefined;
  });

  it('不同 name 的缓存读写隔离', async () => {
    const a = accessor('ns-a');
    const b = accessor('ns-b');

    await a.write('key', Buffer.from('a-value'));
    await b.write('key', Buffer.from('b-value'));

    expect((await a.read('key'))!.toString()).eq('a-value');
    expect((await b.read('key'))!.toString()).eq('b-value');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });
});
