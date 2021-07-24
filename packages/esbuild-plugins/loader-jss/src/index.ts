import { Plugin, build } from 'esbuild';
import { runScript } from '@blog/utils';

import { promises as fs } from 'fs';
import { dirname, basename } from 'path';

export function JssLoader(): Plugin {
  return {
    name: 'loader-jss',
    setup(process) {
      const namespace = 'jss-style';
      const jssSuffix = 'jss-style-suffix';
      const suffixMatcher = new RegExp(`\\.${jssSuffix}$`);
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
          external: ['jss', 'jss-preset-default'],
          logLevel: 'silent',
          stdin: {
            contents: content,
            resolveDir: dirname(args.path),
            sourcefile: basename(args.path),
            loader: 'ts',
          },
        }).catch((e) => {
          return e;
        });

        if (buildResult?.errors && buildResult.errors.length > 0) {
          return {
            errors: buildResult?.errors ?? [],
            loader: 'css',
            contents: '',
          };
        }

        const jssCode = buildResult?.outputFiles[0].text;
        const jssObject = runScript(jssCode ?? '', require);
        const cssCode = jssObject.toString();

        fileData[args.path] = cssCode;

        return {
          loader: 'ts',
          contents: `
            import '${cssPath}';
            export default {
              classes: ${JSON.stringify(jssObject.classes)},
            };
          `,
        };
      });
    },
  };
}
