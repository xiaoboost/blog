import type { BuilderPlugin, ResolveResult } from '@blog/types';
import path from 'path';
import { readFile } from 'fs/promises';
import { getRenameMethod, mergeRename } from './rename';
import { isCssImport } from '../../utils';
import type { FileLoaderOptionInput, Rename } from './types';

const pluginName = 'file-loader';

export const FileLoader = (opt: FileLoaderOptionInput): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    /** 原始文件缓存 */
    const fileCache = new Map<string, Buffer>();
    /** 路径映射缓存 */
    const filePathMap = new Map<string, ResolveResult>();
    /** 重命名配置 */
    const rename = getRenameMethod(builder, opt);

    builder.hooks.start.tap(pluginName, () => {
      if ('test' in builder.renameAsset) {
        builder.renameAsset = mergeRename(builder.renameAsset as Rename, rename);
      } else {
        builder.renameAsset = rename;
      }
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (!rename.test(args.path)) {
          return;
        }

        const resolved = builder.resolve(args.path, args);
        const fileContent = fileCache.get(resolved.path) ?? (await readFile(resolved.path));
        const newName = rename({ path: resolved.path, content: fileContent });

        if (!newName) {
          return;
        }

        if (!fileCache.has(resolved.path)) {
          fileCache.set(resolved.path, fileContent);
        }

        filePathMap.set(newName, resolved);

        return {
          ...resolved,
          path: newName,
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
      // 外部资源上报
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
        if (rename.test(original)) {
          const newName = rename({ path: original, content });

          if (newName) {
            builder.emitAsset({
              path: newName,
              content,
            });
          }
        }
      }
    });
  },
});
