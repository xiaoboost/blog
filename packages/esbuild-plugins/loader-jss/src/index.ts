import { runScript } from '@blog/utils';
import { StyleSheet } from 'jss';
import { isObject } from '@xiao-ai/utils';
import { FileRecorder } from '@blog/esbuild-recorder-file';
import { PluginBuild, build, PartialMessage } from 'esbuild';

import { promises as fs } from 'fs';
import { dirname, basename, normalize } from 'path';

function isJssObject(obj: unknown): obj is StyleSheet {
  return (
    isObject(obj) &&
    'attached' in obj &&
    'classes' in obj &&
    'rules' in obj
  );
}

export function JssLoader() {
  const pluginName = 'loader-jss';
  const namespace = 'jss-style';
  const jssSuffix = 'jss-style-suffix';
  const suffixMatcher = new RegExp(`\\.${jssSuffix}$`);
  const recorder = FileRecorder();

  function getFiles() {
    return recorder.getFiles();
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

        process.onLoad({ filter: /\.jss\.(t|j)s$/ }, async (args) => {
          const cssPath = `${args.path}.${jssSuffix}`.replace(/[\\/]/g, '\\\\');
          const content = await fs.readFile(args.path, 'utf-8');
          const buildResult = await build({
            bundle: true,
            minify: false,
            write: false,
            format: 'cjs',
            mainFields: options.mainFields,
            assetNames: options.assetNames,
            outdir: options.outdir,
            publicPath: options.publicPath,
            define: options.define,
            loader: options.loader,
            external: ['jss', 'jss-preset-default'],
            logLevel: 'silent',
            stdin: {
              contents: content,
              resolveDir: dirname(args.path),
              sourcefile: basename(args.path),
              loader: 'ts',
            },
            plugins: [
              recorder.plugin,
            ],
          }).catch((e) => {
            return e;
          });

          recorder.pushFile(args.path);

          if (buildResult?.errors && buildResult.errors.length > 0) {
            return {
              errors: buildResult?.errors ?? [],
              loader: 'ts',
              contents: '',
            };
          }

          const errors: PartialMessage[] = [];
          const jssCode = buildResult?.outputFiles[0].text;
          const jssObject = runScript(jssCode ?? '', require);

          let cssCode = '';

          if (isJssObject(jssObject)) {
            cssCode = jssObject.toString();
          }
          else {
            errors.push({
              pluginName: pluginName,
              text: 'default 导出应该是个 jss 实例',
            });
          }

          fileData[normalize(args.path)] = cssCode;

          return {
            errors,
            loader: 'ts',
            watchFiles: getFiles(),
            contents: `
              import '${cssPath}';
              export default {
                classes: ${JSON.stringify(jssObject.classes)},
              };
            `,
          };
        });
      },
    },
  };
}
