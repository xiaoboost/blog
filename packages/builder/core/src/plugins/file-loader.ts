import type { AssetData, BuilderPlugin, ResolveResult } from '@blog/types';
import md5 from 'md5';
import path from 'path';
import { readFile } from 'fs/promises';
import { getPathFormatter } from '@blog/node';
import { isCssImport } from '../utils';

const pluginName = 'file-loader';

export interface FileLoaderOption {
  /** 文件匹配 */
  test: RegExp;
  /** 资源名称 */
  name?: string;
}

export const getAssetNames = (name: string, isProduction: boolean) =>
  isProduction ? `${name}/[name].[hash][ext]` : `${name}/[name][ext]`;

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
        if (!fileMatcher.test(args.path)) {
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

    builder.hooks.afterBundler.tap(pluginName, ({ bundler }) => {
      // 外部资源
      for (const [path, val] of filePathMap.entries()) {
        const cache = fileCache.get(val.path);
        if (cache) {
          builder.emitAsset({
            path,
            content: cache,
          });
        }
      }

      // bundler 资源
      for (const { path: original, content } of bundler.getAssets()) {
        if (fileMatcher.test(original)) {
          const nameOpt = path.parse(original);
          const assetPath = getName({
            name: nameOpt.name,
            hash: md5(content),
            ext: nameOpt.ext,
          });

          builder.emitAsset({
            path: assetPath,
            content,
          });
        }
      }
    });
  },
});
