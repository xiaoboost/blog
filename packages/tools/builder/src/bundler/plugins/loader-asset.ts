import { PluginBuild } from 'esbuild';
import { normalize, getNameCreator } from '@blog/shared/node';
import { FileCache } from '../utils';

import md5 from 'md5';

import * as path from 'path';
import { promises as fs } from 'fs';

export interface Options {
  exts: string[];
  cache?: FileCache;
}

function getFileContent(input: string, output: string) {
  return `
    const path = ${JSON.stringify(output)};
    const getContent = () => fsm.readFile(path);

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
