import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'mocha';

describe('Precache 生产构建', () => {
  it('直接使用 Node 启动时，无需 NODE_PATH 也能生成注册脚本和 SW', function () {
    this.timeout(10000);
    const child = spawnSync(process.execPath, [
      '--import', pathToFileURL(require.resolve('tsx')).href,
      resolve(__dirname, 'fixtures/precache-build-probe.cjs'),
    ], {
      cwd: resolve(__dirname, '../..'),
      env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
      encoding: 'utf8',
      timeout: 8000,
    });

    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr || child.stdout);
    const result = JSON.parse(child.stdout);
    assert.deepEqual(result.assets, ['/assets/register-sw.test.js', '/precache.js']);
    assert.deepEqual(result.scripts, [{ src: '/assets/register-sw.test.js' }]);
    assert.equal(result.registeredPath, '/precache.js');
    assert.deepEqual(result.workerEvents.sort(), [
      'activate', 'fetch', 'message',
    ]);
  });
});
