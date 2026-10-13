import { join, resolve } from 'path';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';
import Glob from 'fast-glob';
import md5 from 'md5';

export const postAssetsNamespace = 'post-assets';

/** PostLoader 内部的 MDX 资源入口处理，将 assets: glob 展开为内存脚本。 */
export function applyPostAssets(builder: BuilderInstance) {
  builder.hooks.bundler.tap(postAssetsNamespace, (bundler) => {
    bundler.hooks.resolve.tap({ name: postAssetsNamespace, stage: -100 }, (args) => {
      if (!args.path.startsWith('assets:')) {
        return;
      }

      const pattern = normalize(resolve(args.resolveDir, args.path.slice('assets:'.length)));
      return {
        namespace: postAssetsNamespace,
        path: normalize(join(args.resolveDir, `assets-${md5(pattern)}.script.ts`)),
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
