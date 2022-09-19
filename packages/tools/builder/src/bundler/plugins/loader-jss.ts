import { StyleSheet } from 'jss';
import { isObject, unique } from '@xiao-ai/utils';
import { runScript } from '@xiao-ai/utils/node';
import { normalize } from '@blog/shared/node';
import { FileRecorder, FilePlugin } from './record-file';
import { PluginBuild, build, PartialMessage, BuildResult } from 'esbuild';

import { promises as fs } from 'fs';
import { dirname, basename } from 'path';
import { SourceMapConsumer } from 'source-map';

import jss from 'jss';
import preset from 'jss-preset-default';

jss.setup(preset());

function isJssObject(obj: unknown): obj is StyleSheet {
  return isObject(obj) && 'attached' in obj && 'classes' in obj && 'rules' in obj;
}

export interface Options {
  extractCss?: boolean;
}

export function JssLoader({ extractCss = true }: Options = {}): FilePlugin {
  const pluginName = 'loader-jss';
  const namespace = 'jss-style';
  const jssSuffix = 'jss-style-suffix';
  const suffixMatcher = new RegExp(`\\.${jssSuffix}$`);
  const recorder = FileRecorder();
  const entryFiles = new Set<string>();

  function getFiles() {
    return unique(recorder.getFiles().concat(Array.from(entryFiles.keys())));
  }

  return {
    getFiles,
    plugin: {
      name: 'loader-jss',
      setup(process: PluginBuild) {
        /** 构建选项 */
        const { initialOptions: options } = process;
        /** 文件缓存 */
        const fileData: Record<string, string> = {};

        if (extractCss) {
          process.onResolve({ filter: suffixMatcher }, (args) => ({
            path: args.path,
            pluginData: normalize(args.path.replace(suffixMatcher, '')),
            namespace,
          }));

          process.onLoad({ filter: /.*/, namespace }, async (args) => {
            return {
              loader: 'css',
              resolveDir: dirname(args.path),
              contents: fileData[normalize(args.pluginData)] ?? '',
            };
          });
        }

        process.onLoad({ filter: /\.jss\.(t|j)s$/ }, async (args) => {
          entryFiles.add(args.path);

          const cssPath = normalize(`${args.path}.${jssSuffix}`);
          const content = await fs.readFile(args.path, 'utf-8');
          const buildResult = await build({
            bundle: true,
            write: false,
            format: 'cjs',
            platform: 'node',
            outdir: '/',
            logLevel: 'warning',
            charset: 'utf8',
            sourcemap: true,
            minify: options.minify,
            mainFields: options.mainFields,
            assetNames: options.assetNames,
            publicPath: options.publicPath,
            define: options.define,
            loader: options.loader,
            stdin: {
              contents: content,
              resolveDir: dirname(args.path),
              sourcefile: basename(args.path),
              loader: 'ts',
            },
            plugins: [recorder.plugin],
          }).catch((e: BuildResult) => {
            return e;
          });

          if (buildResult.errors.length > 0) {
            return {
              errors: buildResult.errors ?? [],
              warnings: buildResult.warnings ?? [],
              loader: 'js',
              contents: '',
            };
          }

          const errors: PartialMessage[] = [];
          const files = buildResult?.outputFiles ?? [];
          const jssCode = files.find((file) => file.path.endsWith('.js'))?.text ?? '';
          const result = runScript(jssCode, {
            dirname: __dirname,
            filename: 'jss-bundle.js',
            globalParams: {
              jss,
            },
          });

          let cssCode = '';

          if (result.error) {
            const sourceMapCode = files.find((file) => file.path.endsWith('.map'))?.text ?? '';
            const sourceMapData = JSON.parse(sourceMapCode);
            const map = await new SourceMapConsumer(sourceMapData);
            const originLocation = map.originalPositionFor({
              line: result.error.location?.line ?? 1,
              column: result.error.location?.column ?? 1,
            });

            if (originLocation.line) {
              errors.push({
                pluginName,
                text: result.error.message,
                location: {
                  file: originLocation.source ?? undefined,
                  line: originLocation.line ?? undefined,
                  column: originLocation.column ?? undefined,
                  lineText: result.error.location?.lineText,
                },
              });
            } else {
              errors.push({
                pluginName,
                text: result.error.message,
              });
            }
          } else if (isJssObject(result.output)) {
            cssCode = result.output.toString({
              indent: 0,
              format: !options.minify,
              allowEmpty: false,
            });
          } else {
            errors.push({
              pluginName,
              text: 'default 应该导出 jss 实例',
            });
          }

          const classesString = options.minify
            ? JSON.stringify(result.output.classes ?? {})
            : JSON.stringify(result.output.classes ?? {}, null, 2);

          if (extractCss) {
            fileData[normalize(args.path)] = cssCode;
          }

          return {
            errors,
            loader: 'js',
            watchFiles: getFiles(),
            contents: `
              ${extractCss ? `import '${cssPath}';` : ''}
              export default {
                classes: ${classesString},
              };
            `,
          };
        });
      },
    },
  };
}
