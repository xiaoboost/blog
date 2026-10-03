import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { before, describe, it } from 'mocha';

describe('Runner 调试 source map', function () {
  this.timeout(15000);

  let result: any;

  before(() => {
    // 隔离 inspector，避免开关测试进程或开发者当前连接的调试服务器。
    const child = spawnSync(process.execPath, [
      '--import', pathToFileURL(require.resolve('tsx')).href,
      resolve(__dirname, 'fixtures/runner-sourcemap-probe.cjs'),
    ], {
      cwd: resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 12000,
      env: { ...process.env, NODE_OPTIONS: '' },
    });

    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr || child.stdout);
    result = JSON.parse(child.stdout);
  });

  it('普通构建不写调试缓存，也不修改送入 VM 的代码', () => {
    assert.equal(result.normal.cacheExists, false);
    assert.equal(result.normal.sourceUnchanged, true);
    assert.equal(result.normal.sourceMapURL, '');
  });

  it('调试器可以读取外部 map，并定位带空格、# 和中文的原始 TS', () => {
    assert.match(result.debug.sourceURL, /^file:\/\//);
    assert.match(result.debug.sourceMapURL, /^file:\/\//);
    assert.equal(result.debug.mapInsideCache, true);
    assert.equal(result.debug.mapSource, result.expectedSourceURL);
    assert.deepEqual(result.debug.originalPosition, {
      source: result.expectedSourceURL,
      line: 2,
      column: 6,
    });
    assert.equal(result.debug.sourceContent, result.originalSource);
    assert.equal(result.debug.virtualSource, 'mdx-loader:/virtual/正文.mdx');
  });

  it('watch 重建保留脚本身份，同时为变化的 map 提供新地址', () => {
    assert.equal(result.repeated.sourceURL, result.debug.sourceURL);
    assert.equal(result.repeated.sourceMapURL, result.debug.sourceMapURL);
    assert.equal(result.rebuilt.sourceURL, result.debug.sourceURL);
    assert.notEqual(result.rebuilt.sourceMapURL, result.debug.sourceMapURL);
    assert.equal(result.rebuilt.value, 11);
    assert.ok(result.rebuilt.originalSource.includes('value: number = 11'));
  });

  it('不同 Runner 使用不同脚本身份', () => {
    assert.notEqual(result.other.sourceURL, result.debug.sourceURL);
  });

  it('附加映射不改变模块输出、VM 目录和 require 解析', () => {
    assert.deepEqual(result.normal.output, result.debug.output);
    assert.equal(result.debug.output.value, 7);
    assert.equal(result.debug.output.dirname, result.expectedRuntimeDir);
    assert.equal(result.debug.output.filename, result.expectedRuntimeFile);
    assert.equal(result.debug.output.chalkPath, result.expectedChalkPath);
  });

  it('调试缓存无法写入时，记录原因并继续执行原脚本', () => {
    assert.equal(result.fallback.sourceUnchanged, true);
    assert.equal(result.fallback.sourceMapURL, '');
    assert.equal(result.fallback.errors.length, 1);
    assert.ok(result.fallback.errors[0].includes('[Source Map]'));
    assert.deepEqual(result.fallback.output, result.normal.output);
  });
});
