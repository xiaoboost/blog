import type { BuilderPlugin, BundlerInstance, RunnerInstance } from '@blog/types';

const pluginName = 'assets-merger';

export const AssetsMerger = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    let bundler: BundlerInstance;
    let runner: RunnerInstance;

    builder.hooks.bundler.tap(pluginName, (_bundler) => {
      bundler = _bundler;
    });

    builder.hooks.runner.tap(pluginName, (_runner) => {
      runner = _runner;
    });

    builder.hooks.processAssets.tap(pluginName, (assets) => {
      const bundlerAssets = bundler.getAssets();
      const runnerAssets = runner.getAssets();

      debugger;
      // TODO: 过滤 bundle 出来的代码和 sourcemap

      return assets.concat(bundlerAssets, runnerAssets);
    });
  },
});
