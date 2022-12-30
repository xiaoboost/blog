import type { BuilderPlugin, BundlerInstance, RunnerInstance } from '@blog/types';
import { Bundler } from '../bundler';

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
      const runnerAssets = runner.getAssets();
      const bundlerAssets = bundler
        .getAssets()
        .filter((item) => !item.path.includes(Bundler.BundleFileName));

      return assets.concat(bundlerAssets, runnerAssets);
    });
  },
});
