import { join, resolve } from 'path';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';
import Glob from 'fast-glob';
import md5 from 'md5';

export const postAssetsNamespace = 'post-assets';

/** assets:<glob>[?outDir=<编码后的输出目录>]，未指定目录时沿用公共资源路径。 */
export function applyPostAssets(builder: BuilderInstance) {
  builder.hooks.bundler.tap(postAssetsNamespace, (bundler) => {
    bundler.hooks.resolve.tap({ name: postAssetsNamespace, stage: -100 }, (args) => {
      if (!args.path.startsWith('assets:')) {
        return;
      }

      // 只将明确的 ?outDir= 识别为参数，保留 glob 本身的 ? 通配符。
      const queryIndex = args.path.lastIndexOf('?outDir=');
      const glob = args.path.slice('assets:'.length, queryIndex < 0 ? undefined : queryIndex);
      const outDir = queryIndex < 0 ? '' : decodeURIComponent(args.path.slice(queryIndex + 8));

      if (/(^|[\\/])\.\.([\\/]|$)/.test(outDir) || /^[a-z][a-z\d+.-]*:/i.test(outDir)) {
        throw new Error('assets: outDir 必须是站点内的目录，不能包含 .. 或协议/盘符');
      }

      const pattern = normalize(resolve(args.resolveDir, glob));
      const suffix = outDir ? `?outDir=${encodeURIComponent(outDir)}` : '';
      return {
        namespace: postAssetsNamespace,
        path: normalize(join(args.resolveDir, `assets-${md5(pattern + suffix)}.script.ts`)),
        suffix,
        pluginData: pattern,
      };
    });

    bundler.hooks.load.tapPromise(postAssetsNamespace, async (args) => {
      if (args.namespace !== postAssetsNamespace) {
        return;
      }

      const pattern: string = args.pluginData;
      const files = (await Glob(pattern, { onlyFiles: true })).sort();
      const watchDirs = Glob.generateTasks(pattern).map((task) => task.base);

      return {
        contents: files.map((file) => `import ${JSON.stringify(file)};`).join('\n'),
        source: { format: 'ts' },
        watchFiles: files,
        watchDirs,
      };
    });
  });
}
