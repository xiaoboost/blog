import type { AssetData, BuilderPlugin, RunnerCb } from '@blog/types';
import { isFunc } from '@xiao-ai/utils';

const pluginName = 'asset-extractor';

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.afterRunner.tapPromise(pluginName, async ({ runner }) => {
      const assets = builder.getAssets();
      const oldAssetPaths = assets.map((asset) => asset.path);
      const runnerOutput = runner.getOutput() as RunnerCb;
      const runnerAssets = isFunc(runnerOutput) ? (await runnerOutput(assets)) ?? [] : [];

      // 此时构建产物列表，要过滤掉旧的产物
      const builderAssets = (builder as any).assets as AssetData[];
      const newAssets = builderAssets.filter((asset) => !oldAssetPaths.includes(asset.path));

      (builder as any).assets.length = 0;
      builder.emitAsset(...runnerAssets, ...newAssets);
    });
  },
});
