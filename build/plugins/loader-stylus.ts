import { Plugin } from 'esbuild';
import { resolveRoot } from '../utils/path';

import stylus from 'stylus';
import path from 'path';

import { promises as fs } from 'fs';
import { resolveFile } from './utils';


export function stylusLoader(): Plugin {
  return {
    name: 'stylus-loader',
    setup(build) {
      const namespace = 'stylus';

      build.onResolve({ filter: /\.styl$/ }, args => ({
        namespace,
        path: resolveFile(args.resolveDir, args.path),
      }));

      build.onLoad({ filter: /.*/, namespace, }, async (args) => {
        const content = await fs.readFile(args.path, 'utf-8');
        const styl = stylus(content);

        styl
          .set('filename', args.path)
          .include(resolveRoot('template'))
          .include(resolveRoot('node_modules'));

        const css = await (new Promise<string>((resolve, reject) => {
          styl.render((err, css) => {
            if (err) {
              return reject(err);
            }

            resolve(css);
          });
        }));

        return {
          contents: css,
          resolveDir: path.dirname(args.path),
          loader: 'css',
        };
      });
    },
  };
}
