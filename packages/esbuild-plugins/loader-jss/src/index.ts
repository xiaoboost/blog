import { PluginBuild, build } from 'esbuild';
import { runScript } from '@blog/utils';
import { FileRecorder } from '@blog/esbuild-recorder-file';

import { promises as fs } from 'fs';
import { dirname, basename } from 'path';

export function JssLoader() {
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
          pluginData: args.path.replace(suffixMatcher, ''),
          namespace,
        }));

        process.onLoad({ filter: /.*/, namespace }, async (args) => {
          return {
            loader: 'css',
            resolveDir: dirname(args.path),
            contents: fileData[args.pluginData] ?? '',
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

          const jssCode = buildResult?.outputFiles[0].text;
          const jssObject = runScript(jssCode ?? '', require);
          const cssCode = jssObject.toString();

          fileData[args.path] = cssCode;

          return {
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
