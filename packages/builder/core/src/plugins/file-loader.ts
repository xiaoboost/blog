import type { AssetData, BuilderPlugin } from '@blog/types';

const pluginName = 'file-loader';

export interface FileLoaderOption {
  /** 文件后缀 */
  exts: string[];
  /** 资源名称 */
  assetNames?: string;
  /** 资源公共路径 */
  publicPath?: string;
}

export const FileLoader = (opt: FileLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const assets: AssetData[] = [];

    builder.hooks.start.tap(pluginName, () => {
      assets.length = 0;
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        return null;
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        return null;
      });
    });

    builder.hooks.processAssets.tap(pluginName, (assets) => {
      return assets;
    });
  },
});
