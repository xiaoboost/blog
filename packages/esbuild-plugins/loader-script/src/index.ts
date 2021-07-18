import { build, PluginBuild, OutputFile } from 'esbuild';
import { isProduction } from '@blog/utils';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { promises as fs } from 'fs';

import * as path from 'path';

const outputFiles: OutputFile[] = [];

export function ScriptLoader(outputDir: string, name: string) {
  return {
    name: 'loader-script',
    setup(process: PluginBuild) {
      const namespace = 'script';
      const scriptSuffix = 'script-suffix';
      const originMatcher = new RegExp(`\\.${namespace}\\.(t|j)s$`);
      const suffixMatcher = new RegExp(`\\.${scriptSuffix}$`);

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
          outdir: outputDir,
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

        for (const file of (buildResult?.outputFiles ?? []) as OutputFile[]) {
          if (path.extname(file.path) === '.css') {
            file.path = path.format({
              dir: path.join(outputDir, 'css'),
              name: name,
              ext: '.css',
            });
          }
          else if (path.extname(file.path) === '.js') {
            file.path = path.format({
              dir: path.join(outputDir, 'script'),
              name: name,
              ext: '.js',
            });
          }
          else {
            file.path = path.join(outputDir, 'assets', path.basename(file.path));
          }

          outputFiles.push(file);
        }

        return {
          errors: buildResult?.errors ?? [],
          loader: 'file',
          contents: '',
        };
      });

      process.onLoad({ filter: originMatcher }, (args) => {
        const fullPath = `${args.path}.${scriptSuffix}`.replace(/[\\/]/g, '\\\\');
        return {
          loader: 'ts',
          contents: `import '${fullPath}';`,
        };
      });
    },
  };
}

ScriptLoader.output = () => {
  return outputFiles;
};
