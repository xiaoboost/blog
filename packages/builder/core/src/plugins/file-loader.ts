import type { AssetData, BuilderPlugin, ResolveResult } from '@blog/types';
import md5 from 'md5';
import path from 'path';
import { readFile } from 'fs/promises';
import { isDef } from '@xiao-ai/utils';
import { getPathFormatter } from '@blog/node';
import { isCssImport } from '../utils';

const pluginName = 'file-loader';

export interface FileLoaderOption {
  /** 文件匹配 */
  test: RegExp;
  /** 资源名称 */
  name?: string;
}

export const FileLoader = (opt: FileLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const assets: AssetData[] = [];
    const fileCache = new Map<string, Buffer>();
    const filePathMap = new Map<string, ResolveResult>();
    const { publicPath } = builder.options;
    const { test: fileMatcher, name } = opt;
    const getName = getPathFormatter(path.join(publicPath, name ?? '[name][ext]'));

    builder.hooks.start.tap(pluginName, () => {
      assets.length = 0;
      filePathMap.clear();
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (args.namespace !== 'file' || !fileMatcher.test(args.path)) {
          return;
        }

        const resolved = builder.resolve(args.path, args);
        const fileContent = await readFile(resolved.path);
        const nameOpt = path.parse(resolved.path);
        const assetPath = getName({ name: nameOpt.name, hash: md5(fileContent), ext: nameOpt.ext });

        fileCache.set(resolved.path, fileContent);
        filePathMap.set(assetPath, resolved);

        return {
          ...resolved,
          path: assetPath,
          external: isCssImport(args.kind),
          watchFiles: [resolved.path],
          namespace: pluginName,
        };
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const original = filePathMap.get(args.path);
        const resolveDir = original ? path.dirname(original.path) : undefined;

        return {
          contents: `export default '${args.path}';`,
          loader: 'js',
          resolveDir,
        };
      });
    });

    builder.hooks.processAssets.tap(pluginName, (assets) => {
      const externalFiles = Array.from(filePathMap.entries())
        .map(([key, val]) => {
          const cache = fileCache.get(val.path);

          if (!cache) {
            return;
          }

          return {
            path: key,
            content: cache,
          };
        })
        .filter(isDef);

      const internalFiles = assets.map((asset) => {
        if (!fileMatcher.test(asset.path)) {
          return asset;
        }

        return asset;
      });

      return internalFiles.concat(externalFiles);
    });
  },
});
