import { Plugin } from 'esbuild';
import { resolveRoot } from '../utils';

import path from 'path';

import { promises as fs } from 'fs';

export function moduleCssLoader(): Plugin {
  return {
    name: 'module-css-loader',
    setup(build) {
      const namespace = 'module-css';

      build.onResolve({ filter: /^[^./][^\n]+?\.css$/ }, args => ({
        namespace,
        path: resolveRoot('node_modules', args.path),
      }));

      build.onLoad({ filter: /.*/, namespace, }, async (args) => {
        return {
          contents: await fs.readFile(args.path, 'utf-8'),
          resolveDir: path.dirname(args.path),
          loader: 'css',
        };
      });
    },
  };
}
