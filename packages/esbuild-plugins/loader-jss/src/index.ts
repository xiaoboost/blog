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

      process.onResolve({ filter: suffixMatcher }, (args) => ({
        path: args.path,
        pluginData: args.path.replace(suffixMatcher, ''),
        namespace,
      }));

      process.onLoad({ filter: /.*/, namespace }, async (args) => {
        const content = await fs.readFile(args.pluginData, 'utf-8');
        const buildResult = await build({
          bundle: true,
          minify: false,
          write: false,
          format: 'cjs',
          external: ['jss', 'jss-preset-default'],
          logLevel: 'silent',
          stdin: {
            contents: content,
            resolveDir: dirname(args.pluginData),
            sourcefile: basename(args.pluginData),
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
        const cssCode = runScript(jssCode ?? '', require);

        return {
          loader: 'css',
          contents: cssCode,
        };
      });

      process.onLoad({ filter: /\.jss\.(t|j)s$/ }, (args) => {
        const fullPath = `${args.path}.${jssSuffix}`.replace(/[\\/]/g, '\\\\');
        return {
          loader: 'ts',
          contents: `import '${fullPath}';`,
        };
      });
    },
  };
}
