import type { BuilderPlugin } from '@blog/types';

const pluginName = 'assets-merger';

export const AssetsMerger = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.processAssets.tap(pluginName, (assets) => {
      const { bundler, runner } = builder;

      const bundlerAssets = bundler.getAssets();
      const runnerAssets = runner.getAssets();

      // TODO: 过滤 bundle 出来的代码和 sourcemap

      return assets.concat(bundlerAssets, runnerAssets);
    });
  },
});
