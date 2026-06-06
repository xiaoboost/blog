import { readFile } from 'fs/promises';
import path from 'path';
import type { BuilderPlugin, ResolveResult } from '@blog/types';
import { isArray } from '@xiao-ai/utils';
import { isCssImport } from '../../utils';
import type { Rename } from '../asset-rename-loader';
import type { GlobalAssetOption, GlobalAssetRule } from './types';

export type { GlobalAssetRule, GlobalAssetOption } from './types';

const pluginName = 'global-asset-loader';

/**
 * 全局资源加载器
 *
 * @description 在 Bundler 阶段拦截匹配的文件
 */
export const GlobalAssetLoader = (opt: GlobalAssetOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const rules: GlobalAssetRule[] = isArray(opt) ? opt : [opt];

    /** 检测文件是否命中规则 */
    const matchFile = (file: string) => rules.some(({ test }) => test.test(file));

    /** 原始文件缓存 */
    const fileCache = new Map<string, Buffer>();
    /** 路径映射缓存: renamed path → ResolveResult */
    const filePathMap = new Map<string, ResolveResult>();

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (!matchFile(args.path)) {
          return;
        }

        const resolved = builder.resolve(args.path, args);
        const fileContent = fileCache.get(resolved.path) ?? (await readFile(resolved.path));
        const newName = builder.renameAsset({ path: resolved.path, content: fileContent });

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
      for (const [renamedPath, resolved] of filePathMap.entries()) {
        const cache = fileCache.get(resolved.path);
        if (cache) {
          builder.emitAsset({
            path: renamedPath,
            content: cache,
          });
        }
      }

      // bundler 产物重命名 + 上报
      for (const { path: original, content } of bundler.getAssets()) {
        const newName = builder.renameAsset({ path: original, content });

        if (newName) {
          builder.emitAsset({
            path: newName,
            content,
          });
        }
      }
    });
  },
});
