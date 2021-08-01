import { build, PluginBuild, OutputFile, BuildOptions } from 'esbuild';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { FileRecorder } from '@blog/esbuild-recorder-file';
import { unique } from '@xiao-ai/utils';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs-extra';

export interface Options {
  name: string;
  minify?: boolean;
  scriptDir?: string;
  styleDir?: string;
}

function normalizeOption(opt: Options, buildOpt: BuildOptions): Required<Options> {
  return {
    name: opt.name,
    minify: opt.minify ?? buildOpt.minify ?? false,
    scriptDir: opt.scriptDir ?? 'scripts',
    styleDir: opt.styleDir ?? 'styles',
  };
}

function getNameCreator(origin: string) {
  return function getName(name: string, hash?: string) {
    return origin
      .replace(/\[name\]/g, name)
      .replace(/\[hash\]/g, hash ?? '');
  };
}

export function ScriptLoader(opt: Options) {
  const fileRecorder = FileRecorder();
  const jssLoader = JssLoader();

  function getFiles() {
    return unique(fileRecorder.getFiles().concat(jssLoader.getFiles()));
  }

  return {
    getFiles,
    plugin: {
      name: 'loader-script',
      setup(esbuild: PluginBuild) {
        const outputDir = process.cwd();
        const { initialOptions: options } = esbuild;
        const loaderOpt = normalizeOption(opt, options);
        const getName = getNameCreator(
          options.assetNames
            ? path.basename(options.assetNames)
            : '[name]'
        );

        esbuild.onLoad({ filter: /\.script\.(t|j)s$/ }, async (args) => {
          const content = await fs.readFile(args.path, 'utf-8');
          const buildResult = await build({
            bundle: true,
            write: false,
            format: 'iife',
            logLevel: 'silent',
            minify: loaderOpt.minify,
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
            plugins: [
              jssLoader.plugin,
              fileRecorder.plugin,
            ],
          }).catch((e) => {
            return e;
          });

          console.log('rebuild');
          console.log(getFiles());

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
                dir: path.join(loaderOpt.styleDir, relativePath),
                name: getName(loaderOpt.name, hash),
              });
            }
            else if (path.extname(file.path) === '.js') {
              // 跳过空脚本
              if (/^\(\(\) ?=> ?{\n?}\)\(\);$/.test(file.text.trim())) {
                continue;
              }

              const hash = md5(file.contents);
              codeContent = JSON.stringify(file.text);
              filePath = path.format({
                ext: '.js',
                dir: path.join(loaderOpt.scriptDir, relativePath),
                name: getName(loaderOpt.name, hash),
              });
            }
            else {
              filePath = path.relative(outputDir, file.path);
              codeContent = `Buffer.from([${file.contents.join(',')}])`;
            }

            code += (
              '{\n' +
              `  path: \`${filePath.replace(/[\\/]+/g, '\\\\')}\`,\n` +
              `  contents: ${codeContent},\n` +
              '},\n'
            );
          }

          code += '];';

          return {
            loader: 'ts',
            contents: code,
            watchFiles: getFiles(),
          };
        });
      },
    },
  };
}
