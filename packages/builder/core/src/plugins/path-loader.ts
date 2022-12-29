import type { BuilderPlugin } from '@blog/types';

const pluginName = 'path-loader';

export interface PathLoaderOption {
  /** 文件后缀 */
  exts: string[];
}

export const PathLoader = ({ exts }: PathLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (args.namespace) {
          return;
        }

        if (exts.some((ext) => args.path.endsWith(ext))) {
          // ..
        }
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        return {
          contents: `export default '${args.path}';`,
          loader: 'js',
        };
      });
    });
  },
});
