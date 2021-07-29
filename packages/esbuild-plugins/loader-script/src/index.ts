import { build, PluginBuild, OutputFile } from 'esbuild';
import { JssLoader } from '@blog/esbuild-loader-jss';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs-extra';

export interface Options {
  name: string;
  outDir?: string;
  assetDir?: string;
  scriptDir?: string;
  styleDir?: string;
}

function getNameCreator(origin: string) {
  return function getName(name: string, hash?: string) {
    return origin
      .replace(/\[name\]/g, name)
      .replace(/\[hash\]/g, hash ?? '');
  };
}

export function ScriptLoader(loaderOpt: Options) {
  return {
    name: 'loader-script',
    setup(process: PluginBuild) {
      const { initialOptions: options } = process;
      const getName = getNameCreator(options.assetNames ?? '[name].[ext]');
      const outputDir = loaderOpt.outDir
        ? path.join(options.outdir ?? '/', loaderOpt.outDir)
        : options.outdir;

      process.onLoad({ filter: /\.script\.(t|j)s$/ }, async (args) => {
        const content = await fs.readFile(args.path, 'utf-8');
        const buildResult = await build({
          bundle: true,
          write: false,
          format: 'iife',
          logLevel: 'silent',
          minify: options.minify,
          outdir: outputDir,
          loader: options.loader,
          assetNames: options.assetNames,
          publicPath: options.publicPath,
          stdin: {
            contents: content,
            resolveDir: path.dirname(args.path),
            sourcefile: path.basename(args.path),
            loader: 'ts',
          },
          define: options.define,
          plugins: [
            JssLoader(),
          ],
        }).catch((e) => {
          return e;
        });

        let code = 'export default [';

        for (const file of (buildResult?.outputFiles ?? []) as OutputFile[]) {
          let filePath = '';

          const relativePath = path.relative(outputDir ?? '/', path.dirname(file.path));

          if (path.extname(file.path) === '.css') {
            const hash = md5(file.contents);
            filePath = path.format({
              ext: '.css',
              dir: path.join('/', loaderOpt.styleDir ?? '/', relativePath),
              name: getName(loaderOpt.name, hash),
            });
          }
          else if (path.extname(file.path) === '.js') {
            // 跳过空脚本
            if (file.text.trim() === '(()=>{})();') {
              continue;
            }

            const hash = md5(file.contents);
            filePath = path.format({
              ext: '.js',
              dir: path.join('/', loaderOpt.scriptDir ?? '/', relativePath),
              name: getName(loaderOpt.name, hash),
            });
          }
          // TODO:
          else {
            // file.path = path.join(outDir, staticDir, webAssetsDir, path.basename(file.path));
          }

          filePath = filePath.replace(/[\\/]+/g, '\\\\');

          code += (
            '{\n' +
            `path: \`${filePath}\`,\n` +
            `contents: Buffer.from([${file.contents.join(',')}]),\n` +
            '},\n'
          );
        }

        code += '];';

        return {
          loader: 'ts',
          contents: code,
        };
      });
    },
  };
}
