import { Plugin } from 'esbuild';
import { resolveRoot } from './path';

import stylus from 'stylus';
import path from 'path';

import { promises as fs } from 'fs';

const resolveTemplate = (...paths: string[]) => {
  return resolveRoot('packages/templates', ...paths);
};

const resolveFile = (dir: string, file: string) => path.resolve(
  process.cwd(),
  path.relative(process.cwd(), dir),
  file,
);

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
          .include(resolveTemplate('src'))
          .include(resolveTemplate('node_modules'));
  
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

export function fontLoader(): Plugin {
  return {
    name: 'font-loader',
    setup(build) {
      const namespace = 'font';
      const exts = ['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];
      const files = new RegExp(`\\.(${exts.join('|')})`);
      const resolveAssets = (...paths: string[]) => {
        return resolveTemplate('src/assets', ...paths);
      };

      build.onResolve({ filter: files, }, args => {
        if (args.path.startsWith('/')) {
          return {
            path: resolveAssets(args.path),
            namespace,
          };
        }
        else {
          return {
            namespace,
            path: resolveFile(args.resolveDir, args.path),
          }
        }
      });

      build.onLoad({ filter: /.*/, namespace, }, async args => {
        return {
          contents: await fs.readFile(args.path),
          resolveDir: path.dirname(args.path),
          loader: 'file',
        };
      });
    },
  }
}

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
