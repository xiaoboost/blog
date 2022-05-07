import { build, PluginBuild, OutputFile } from 'esbuild';
import { unique } from '@xiao-ai/utils';
import { getNameCreator, normalize } from '@blog/shared/node';
import { JssLoader } from './loader-jss';
import { FileRecorder } from './record-file';
import { FileCache, CacheVarName } from '../utils';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs';

export interface Options {
  scriptNames?: string;
  styleNames?: string;
  cache?: FileCache;
}

const nameMap = new Map<string, boolean>();

function getAssetName(entry: string) {
  const importName = path.basename(entry);
  const nameMatch = /^([^.]+)/.exec(importName);

  let name = 'index';

  if (nameMatch) {
    name = nameMatch[1];
  }

  let index = 1;
  let current = name;

  while (nameMap.has(current)) {
    current = `${name}-${index}`;
    index++;
  }

  nameMap.set(current, true);

  return current;
}

export function ScriptLoader(loaderOpt: Options) {
  const fileRecorder = FileRecorder();
  const jssLoader = JssLoader({
    extractCss: true,
  });

  function getFiles() {
    return unique(fileRecorder.getFiles().concat(jssLoader.getFiles()));
  }

  function getContentCode(filePath: string, file: OutputFile) {
    if (loaderOpt.cache) {
      loaderOpt.cache.writeFile(filePath, Buffer.from(file.contents));
      return `() => ${CacheVarName}.readFile(${JSON.stringify(filePath)})`;
    } else {
      return `() => Buffer.from([${file.contents.join(',')}])`;
    }
  }

  return {
    getFiles,
    plugin: {
      name: 'loader-script',
      setup(esbuild: PluginBuild) {
        const { initialOptions: options } = esbuild;
        const outputDir = options.outdir ?? process.cwd();
        const getStyleName = getNameCreator(loaderOpt.styleNames ?? options.assetNames ?? '[name]');
        const getScriptName = getNameCreator(
          loaderOpt.scriptNames ?? options.assetNames ?? '[name]',
        );

        esbuild.onLoad({ filter: /\.script\.(t|j)s$/ }, async (args) => {
          const content = await fs.promises.readFile(args.path, 'utf-8');
          const entryName = getAssetName(args.path);
          const buildResult = await build({
            bundle: true,
            write: false,
            format: 'iife',
            platform: 'browser',
            logLevel: 'warning',
            charset: 'utf8',
            outdir: outputDir,
            minify: options.minify,
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

          let code = 'export default [\n';

          if (buildResult.errors.length > 0) {
            return {
              errors: buildResult.errors ?? [],
              warnings: buildResult.warnings ?? [],
              loader: 'js',
              contents: '',
            };
          }

          for (const file of (buildResult?.outputFiles ?? []) as OutputFile[]) {
            let filePath = '';
            let getContent = '';

            const relativePath = path.relative(outputDir, path.dirname(file.path));

            if (path.extname(file.path) === '.css') {
              // 跳过空文件
              if (file.text.trim().length === 0) {
                continue;
              }

              const hash = md5(file.contents);

              filePath = normalize(
                path.format({
                  ext: '.css',
                  dir: path.join('/', relativePath),
                  name: getStyleName({ name: entryName, hash }),
                }),
              );

              getContent = getContentCode(filePath, file);
            } else if (path.extname(file.path) === '.js') {
              // 跳过空文件
              if (/^\(\(\)\s*=>\s*\{\s*\}\)\(\);\s*$/.test(file.text.trim())) {
                continue;
              }

              const hash = md5(file.contents);

              filePath = normalize(
                path.format({
                  ext: '.js',
                  dir: path.join('/', relativePath),
                  name: getScriptName({ name: entryName, hash }),
                }),
              );
              getContent = getContentCode(filePath, file);
            } else {
              filePath = normalize(path.join('/', path.relative(outputDir, file.path)));
              getContent = getContentCode(filePath, file);
            }

            code +=
              '  {\n' +
              `    path: ${JSON.stringify(filePath)},\n` +
              `    getContent: ${getContent},\n` +
              '  },\n';
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
