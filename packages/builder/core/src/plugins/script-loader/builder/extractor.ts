import { basename } from 'path';
import type { BuilderPlugin, AssetData } from '@blog/types';
import { isBundleFile, BundleFileName } from '../../../bundler/utils';
import { EntrySuffix } from '../utils';

const pluginName = 'asset-extractor';

/** 全局 script 入口引用记录 */
const scriptIsInside = new Map<string, boolean>();

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { entry },
    } = builder;
    const chunkName = basename(entry).replace(EntrySuffix, '');
    let previousBundles = new Set<string>();
    let currentBundles = new Set<string>();

    // 增量构建可能不再输出 CSS / JS，资源列表不能继续保留上一轮的产物。
    builder.hooks.processAssets.tap(pluginName, (assets) => {
      const result = assets.filter((asset) =>
        !previousBundles.has(asset.path) || currentBundles.has(asset.path),
      );
      previousBundles = currentBundles;
      return result;
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolveResult.tap(pluginName, (result) => {
        if (result.path && result.path !== entry && EntrySuffix.test(result.path)) {
          scriptIsInside.set(result.path, true);
        }
      });
    });

    builder.hooks.runner.tap(pluginName, (runner) => {
      // 忽略运行器
      runner.run = () => Promise.resolve();
    });

    builder.hooks.afterBundler.tap(pluginName, ({ bundler }) => {
      currentBundles = new Set();

      // 当前插件是内部插件，则跳过
      if (scriptIsInside.get(entry)) {
        return;
      }

      const isSpaceJsFile = (code: string) =>
        code.length > 0 && /^\(\(\)\s*=>\s*\{\s*\}\)\(\);\s*$/.test(code);
      const isEmitFile = (asset: AssetData) => {
        // 跳过非构建产物文件
        if (!isBundleFile(asset.path)) {
          return false;
        }

        // 跳过空 js 文件
        if (/\.js$/.test(asset.path) && isSpaceJsFile(asset.content.toString())) {
          return false;
        }

        // 跳过 map 文件
        if (/\.map$/.test(asset.path)) {
          return false;
        }

        return true;
      };

      bundler.getAssets(true).forEach((asset) => {
        if (!isEmitFile(asset)) {
          return;
        }

        const { path: oldPath, content } = asset;
        const nameWithChunk = oldPath.replace(BundleFileName, chunkName);
        const newPath = builder.parent?.renameAsset({ path: nameWithChunk, content });

        if (!newPath) {
          return;
        }

        currentBundles.add(newPath);
        builder.emitAsset({
          path: newPath,
          content,
        });
      });
    });
  },
});
