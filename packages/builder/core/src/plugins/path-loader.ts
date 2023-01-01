import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { normalize } from '@blog/node';
import { isCssImport } from '../utils';

const pluginName = 'path-loader';

export interface PathLoaderOption {
  /** 文件匹配 */
  test: RegExp;
}

/** 注入原始路径 */
export const PathLoader = ({ test }: PathLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (args.namespace !== 'file' || !test.test(args.path)) {
          return;
        }

        const resolved = builder.resolve(args.path, args);
        const path = normalize(resolved.path);

        return {
          ...resolved,
          path,
          external: isCssImport(args.kind),
          watchFiles: [path],
          namespace: pluginName,
        };
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        return {
          contents: `export default '${args.path}';`,
          loader: 'js',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
