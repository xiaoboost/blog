import type { BuilderPlugin, BundlerInstance, RunnerInstance, AssetData } from '@blog/types';
import { isFunc } from '@xiao-ai/utils';
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

    builder.hooks.processAssets.tapPromise(pluginName, async (assets) => {
      const bundlerAssets = bundler
        .getAssets()
        .filter((item) => !item.path.includes(Bundler.BundleFileName));

      const runnerOutput = runner.getOutput() as () => Promise<AssetData[]>;
      const runnerAssets = isFunc(runnerOutput) ? (await runnerOutput()) ?? [] : [];

      return assets.concat(bundlerAssets, runnerAssets);
    });
  },
});
