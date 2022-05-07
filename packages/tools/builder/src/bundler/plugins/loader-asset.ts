import { PluginBuild } from 'esbuild';
import { normalize, getNameCreator } from '@blog/shared/node';
import { FileCache } from '../utils';
import { CacheVarName } from '../context';

import md5 from 'md5';

import * as path from 'path';
import { promises as fs } from 'fs';

export interface Options {
  exts: string[];
  cache?: FileCache;
}

export function AssetLoader(loaderOpt: Options) {
  return {
    name: 'loader-asset',
    setup(esbuild: PluginBuild) {
      const { initialOptions: options } = esbuild;
      const namespace = 'asset-loader';
      const publicPath = options.publicPath ?? '/';
      const fileExts = loaderOpt.exts.map((name) => name.replace(/^\.+/, '')).join('|');
      const fileMatcher = new RegExp(`\\.(${fileExts})$`);
      const getName = getNameCreator(options.assetNames ?? '[name]');

      function getFileContent(filePath: string, content: Uint8Array) {
        let getContent = '';

        if (loaderOpt.cache) {
          loaderOpt.cache.writeFile(filePath, Buffer.from(content));
          getContent = `() => ${CacheVarName}.readFile(${JSON.stringify(filePath)})`;
        } else {
          getContent = `() => Buffer.from([${content.join(',')}])`;
        }

        return `
          const path = ${JSON.stringify(filePath)};
          const getContent = () => ${CacheVarName}.readFile(${JSON.stringify(filePath)});

          export default {
            path: ${JSON.stringify(filePath)},
            getContent: ${getContent},
          };
        `;
      }

      esbuild.onResolve({ filter: fileMatcher }, (args) => {
        if (path.isAbsolute(args.path)) {
          return {
            namespace,
            path: args.path,
          };
        } else {
          return {
            namespace,
            path: path.resolve(args.resolveDir, args.path),
          };
        }
      });

      esbuild.onLoad({ filter: fileMatcher, namespace }, async (args) => {
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
          contents: getFileContent(normalize(path.join(publicPath, assetPath)), content),
        };
      });
    },
  };
}
