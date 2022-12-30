import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { normalize } from '@blog/node';
import { isCssImport } from '../utils';

const pluginName = 'path-loader';

export interface PathLoaderOption {
  /** 文件后缀 */
  exts: string[];
}

/** 注入原始路径 */
export const PathLoader = ({ exts }: PathLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const fileExts = exts.map((name) => name.replace(/^\.+/, '')).join('|');
    const fileMatcher = new RegExp(`\\.(${fileExts})$`);

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (args.namespace !== 'file' || !fileMatcher.test(args.path)) {
          return;
        }

        const resolved = builder.resolve(args.path, args);

        return {
          ...resolved,
          external: isCssImport(args.kind),
          watchFiles: [resolved.path],
          namespace: pluginName,
        };
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        return {
          contents: `export default '${normalize(args.path)}';`,
          loader: 'js',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
