import type { BuilderPlugin, AssetData } from '@blog/types';
import { isFunc } from '@xiao-ai/utils';

const pluginName = 'asset-extractor';

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.afterRunner.tapPromise(pluginName, async ({ runner }) => {
      const runnerOutput = runner.getOutput() as () => Promise<AssetData[]>;
      const runnerAssets = isFunc(runnerOutput) ? (await runnerOutput()) ?? [] : [];
      runnerAssets.forEach((asset) => builder.emitAsset(asset));
    });
  },
});
