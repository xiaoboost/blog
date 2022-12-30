import type { AssetData, BuilderPlugin, ResolveResult } from '@blog/types';
import md5 from 'md5';
import path from 'path';
import { readFile } from 'fs/promises';
import { isDef } from '@xiao-ai/utils';
import { normalize, getNameCreator } from '@blog/node';
import { isCssImport } from '../utils';

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
    const fileCache = new Map<string, Buffer>();
    const filePathMap = new Map<string, ResolveResult>();
    const { exts, assetNames, publicPath } = opt;
    const fileExts = exts.map((name) => name.replace(/^\.+/, '')).join('|');
    const fileMatcher = new RegExp(`\\.(${fileExts})$`);
    const getName = getNameCreator(path.join(publicPath ?? '/', assetNames ?? '[name]'));

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
        const assetName = getName({ name: nameOpt.name, hash: md5(fileContent) });
        const assetPath = normalize(
          path.format({
            name: assetName,
            ext: nameOpt.ext,
          }),
        );

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
      const files = Array.from(filePathMap.entries())
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

      return assets.concat(files);
    });
  },
});
