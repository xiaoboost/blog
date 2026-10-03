/* eslint-disable @typescript-eslint/no-require-imports -- 隔离 CommonJS 子进程验证直接使用 Node 启动。 */
const assert = require('node:assert/strict');
const { runInNewContext } = require('node:vm');
const { AsyncSeriesHook, AsyncSeriesWaterfallHook, SyncHook } = require('tapable');
const { Precache } = require('../../plugins/precache/index.ts');

async function main() {
  assert.equal(process.env.NODE_PATH, '');
  const hooks = {
    runner: new SyncHook(['runner']),
    processAssets: new AsyncSeriesWaterfallHook(['assets']),
  };
  const afterReady = new AsyncSeriesHook(['context']);
  const assets = [];
  const scripts = [];
  Precache().apply({ options: { mode: 'production' }, hooks });
  hooks.runner.call({ registerHook: (callback) => callback({ hooks: { afterReady } }) });
  await afterReady.promise({
    site: {
      addAsset: (asset) => assets.push(asset),
      addScript: (script) => scripts.push(script),
    },
    rename: () => '/assets/register-sw.test.js',
  });
  const output = await hooks.processAssets.promise(assets);
  assert.equal(output.length, 2);

  let registeredPath;
  runInNewContext(output[0].content.toString(), {
    navigator: {
      serviceWorker: {
        addEventListener() {},
        startMessages() {},
        register(value) {
          registeredPath = value;
          return Promise.resolve();
        },
      },
    },
    window: { addEventListener() {} },
  });
  const workerEvents = [];
  runInNewContext(output[1].content.toString(), {
    self: { addEventListener: (name) => workerEvents.push(name) },
  });
  return {
    assets: output.map((asset) => asset.path),
    scripts,
    registeredPath,
    workerEvents,
  };
}

main().then((result) => {
  process.stdout.write(JSON.stringify(result));
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
