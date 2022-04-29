import { PluginBuild } from 'esbuild';
import { normalize, getNameCreator } from '@blog/node';

import md5 from 'md5';

import * as path from 'path';
import { promises as fs } from 'fs';

export interface Options {
  exts: string[];
}

function getFileContent(input: string, output: string) {
  return `
    import { promises as fs } from 'fs';

    let cache;

    const path = ${JSON.stringify(output)};
    const getContent = async () => {
      if (!cache) {
        cache = await fs.readFile(${JSON.stringify(input)}, 'binary');
      }

      return cache;
    };

    export default {
      path,
      getContent,
    };
  `;
}

export function FileLoader(opt: Options) {
  return {
    name: 'loader-file',
    setup(esbuild: PluginBuild) {
      const { initialOptions: options } = esbuild;
      const publicPath = options.publicPath ?? '/';
      const fileExts = opt.exts.map((name) => name.replace(/^\.+/, '')).join('|');
      const fileMatcher = new RegExp(`\\.(${fileExts})$`);
      const getName = getNameCreator(options.assetNames ?? '[name]');

      esbuild.onLoad({ filter: fileMatcher }, async (args) => {
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
          contents: getFileContent(args.path, normalize(path.join(publicPath, assetPath))),
        };
      });
    },
  };
}
