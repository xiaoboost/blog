import { Plugin } from 'esbuild';
import { resolveRoot } from '../utils/path';

import path from 'path';

import { promises as fs } from 'fs';

const resolveTemplate = (...paths: string[]) => {
  return resolveRoot('packages/templates', ...paths);
};

export function moduleCssLoader(): Plugin {
  return {
    name: 'module-css-loader',
    setup(build) {
      const namespace = 'module-css';
      const resolveModules = (...paths: string[]) => {
        return resolveTemplate('node_modules', ...paths);
      };

      build.onResolve({ filter: /^[^./][^\n]+?\.css$/ }, args => ({
        namespace,
        path: resolveModules(args.path),
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
