import { build, PluginBuild, OutputFile } from 'esbuild';
import { isProduction } from '@blog/utils';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { promises as fs } from 'fs';

import md5 from 'md5';
import * as path from 'path';

const outputFiles: OutputFile[] = [];

export interface Options {
  name: string;
}

export interface FileNameOption {
  name: string;
  hash: string;
  ext: string;
}

function getNameCreator(name: string) {
  return (option: FileNameOption) => {
    return name
      .replace(/\[name\]/g, option.name)
      .replace(/\[hash\]/g, option.hash)
      .replace(/\[ext\]/g, option.ext);
  };
}

export function ScriptLoader({ name }: Options) {
  const getName = getNameCreator(name);
  const namespace = 'script';
  const scriptSuffix = 'script-suffix';
  const suffixMatcher = new RegExp(`\\.${scriptSuffix}$`);

  return {
    name: 'loader-script',
    setup(process: PluginBuild) {
      const options = { ...process.initialOptions };

      debugger;
      outputFiles.length = 0;

      process.onResolve({ filter: suffixMatcher }, (args) => ({
        path: args.path,
        pluginData: args.path.replace(suffixMatcher, ''),
        namespace,
      }));

      process.onLoad({ filter: /.*/, namespace }, async (args) => {
        const content = await fs.readFile(args.pluginData, 'utf-8');
        const buildResult = await build({
          bundle: true,
          minify: isProduction,
          write: false,
          format: 'iife',
          logLevel: 'silent',
          outdir: options.outdir,
          publicPath: '/assets/',
          stdin: {
            contents: content,
            resolveDir: path.dirname(args.pluginData),
            sourcefile: path.basename(args.pluginData),
            loader: 'ts',
          },
          plugins: [
            JssLoader(),
          ],
        }).catch((e) => {
          return e;
        });

        debugger;
        for (const file of (buildResult?.outputFiles ?? []) as OutputFile[]) {
          // if (path.extname(file.path) === '.css') {
          //   file.path = path.format({
          //     dir: path.join(outputDir, 'css'),
          //     name: name,
          //     ext: hash ? `.${md5(file.contents)}.css` : '.css',
          //   });
          // }
          // else if (path.extname(file.path) === '.js') {
          //   file.path = path.format({
          //     dir: path.join(outputDir, 'script'),
          //     name: name,
          //     ext: hash ? `.${md5(file.contents)}.js` : '.js',
          //   });
          // }
          // else {
          //   // TODO:
          //   file.path = path.join(outputDir, 'assets', path.basename(file.path));
          // }

          outputFiles.push(file);
        }

        return {
          errors: buildResult?.errors ?? [],
          loader: 'file',
          contents: '',
        };
      });

      process.onLoad({ filter: /\.script\.(t|j)s$/ }, (args) => {
        const fullPath = `${args.path}.${scriptSuffix}`.replace(/[\\/]/g, '\\\\');

        return {
          loader: 'ts',
          contents: '',
        };
      });
    },
  };
}

ScriptLoader.output = () => {
  return outputFiles.slice();
};
