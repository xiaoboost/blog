import { build, PluginBuild, OutputFile, BuildOptions } from 'esbuild';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { FileRecorder } from '@blog/esbuild-recorder-file';
import { unique } from '@xiao-ai/utils';
import { getNameCreator } from '@blog/utils';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs';

export interface Options {
  name: string;
  minify?: boolean;
  scriptNames?: string;
  styleNames?: string;
}

export function ScriptLoader(loaderOpt: Options) {
  const fileRecorder = FileRecorder();
  const jssLoader = JssLoader();

  let inputFile = '';

  function getFiles() {
    return unique(fileRecorder.getFiles().concat(jssLoader.getFiles()));
  }

  return {
    getFiles,
    plugin: {
      name: 'loader-script',
      setup(esbuild: PluginBuild) {
        const { initialOptions: options } = esbuild;
        const outputDir = process.cwd();
        const getStyleName = getNameCreator(loaderOpt.styleNames ?? options.assetNames ?? '[name]');
        const getScriptName = getNameCreator(
          loaderOpt.styleNames ?? options.assetNames ?? '[name]',
        );

        esbuild.onLoad({ filter: /\.script\.(t|j)s$/ }, async (args) => {
          const content = await fs.promises.readFile(args.path, 'utf-8');
          const buildResult = await build({
            bundle: true,
            write: false,
            format: 'iife',
            platform: 'browser',
            logLevel: 'warning',
            charset: 'utf8',
            minify: loaderOpt.minify ?? options.minify ?? false,
            outdir: outputDir,
            loader: options.loader,
            mainFields: options.mainFields,
            assetNames: options.assetNames,
            publicPath: options.publicPath,
            stdin: {
              contents: content,
              resolveDir: path.dirname(args.path),
              sourcefile: path.basename(args.path),
              loader: 'ts',
            },
            define: options.define,
            plugins: [jssLoader.plugin, fileRecorder.plugin],
          }).catch((e) => {
            return e;
          });

          inputFile = args.path;

          let code = 'export default [';

          for (const file of (buildResult?.outputFiles ?? []) as OutputFile[]) {
            let filePath = '';
            let codeContent = '';

            const relativePath = path.relative(outputDir, path.dirname(file.path));

            if (path.extname(file.path) === '.css') {
              const hash = md5(file.contents);
              codeContent = JSON.stringify(file.text);
              filePath = path.format({
                ext: '.css',
                dir: path.join('/', relativePath),
                name: getStyleName({ name: loaderOpt.name, hash }),
              });
            } else if (path.extname(file.path) === '.js') {
              // 跳过空脚本
              if (/^\(\(\)\S*=>\S*\{\S*\}\)\(\);\S*$/.test(file.text.trim())) {
                continue;
              }

              const hash = md5(file.contents);
              codeContent = JSON.stringify(file.text);
              filePath = path.format({
                ext: '.js',
                dir: path.join('/', relativePath),
                name: getScriptName({ name: loaderOpt.name, hash }),
              });
            } else {
              filePath = path.join('/', path.relative(outputDir, file.path));
              codeContent = `Buffer.from([${file.contents.join(',')}])`;
            }

            code +=
              '{\n' +
              `  path: \`${filePath.replace(/[\\/]+/g, '\\\\')}\`,\n` +
              `  contents: ${codeContent},\n` +
              '},\n';
          }

          code += '];';

          return {
            loader: 'js',
            contents: code,
            watchFiles: getFiles(),
          };
        });
      },
    },
  };
}
