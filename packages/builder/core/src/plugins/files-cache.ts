import md5 from 'md5';
import path from 'path';

import type { BuilderPlugin } from '@blog/types';
import { normalize, getNameCreator } from '@blog/node';
// import { getFileAccessor } from '@blog/context';
import { promises as fs } from 'fs';

export interface Options {
  exts: string[];
}

const pluginName = 'files-cache';

export const FilesCache = (loaderOpt: Options): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const fileExts = loaderOpt.exts.map((name) => name.replace(/^\.+/, '')).join('|');
    const fileMatcher = new RegExp(`\\.(${fileExts})$`);

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      const { publicPath, assetNames } = builder.options;
      const getName = getNameCreator(assetNames ?? '[name]');

      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (fileMatcher.test(args.path)) {
          if (path.isAbsolute(args.path)) {
            return {
              namespace: pluginName,
              path: args.path,
            };
          } else {
            return {
              namespace: pluginName,
              path: path.resolve(args.resolveDir, args.path),
            };
          }
        }
      });

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (fileMatcher.test(args.path) && args.namespace === pluginName) {
          const content = await fs.readFile(args.path);
          const nameOpt = path.parse(args.path);
          const assetName = getName({ name: nameOpt.name, hash: md5(content) });
          const assetPath = path.format({
            name: assetName,
            ext: nameOpt.ext,
          });

          return {
            loader: 'js',
            watchFiles: [args.path],
            contents: '',
            // contents: getFileAccessor(
            //   normalize(path.join(publicPath, assetPath)),
            //   content,
            // ).getCode(),
          };
        }
      });
    });
  },
});
