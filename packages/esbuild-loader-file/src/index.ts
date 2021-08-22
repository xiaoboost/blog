import { PluginBuild } from 'esbuild';
import { normalize, getNameCreator } from '@blog/utils';

import md5 from 'md5';

import * as path from 'path';
import { promises as fs } from 'fs';

export interface Options {
  files: string[];
}

export function FileLoader(opt: Options) {
  return {
    name: 'loader-file',
    setup(esbuild: PluginBuild) {
      const namespace = 'file-loader';
      const { initialOptions: options } = esbuild;
      const publicPath = options.publicPath ?? '/';
      const fileExts = opt.files.map((name) => name.replace(/^\.+/, '')).join('|');
      const fileMatcher = new RegExp(`\\.(${fileExts})$`);
      const getName = getNameCreator(options.assetNames ?? '[name]');

      esbuild.onResolve({ filter: fileMatcher }, (args) => {
        if (path.isAbsolute(args.path)) {
          return {
            namespace,
            path: args.path,
          };
        }
        else {
          return {
            namespace,
            path: path.resolve(args.resolveDir, args.path),
          };
        }
      });

      esbuild.onLoad({ filter: /.*/, namespace }, async (args) => {
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
          contents: `
            export default {
              path: \`${normalize(path.join(publicPath, assetPath))}\`,
              contents: Buffer.from([${content.join(',')}]),
            };
          `.trim(),
        };
      });
    },
  };
}
