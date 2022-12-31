import type { BuilderPlugin, BuilderInstance, ErrorData } from '@blog/types';
import { replaceExt } from '@blog/node';
import { dirname } from 'path';
import { CssExtractor } from './css-extractor';

export interface JssLoaderOptions {
  extractCss?: boolean;
}

const pluginName = 'jss-loader';
const jssLoaderCache = new Map<string, BuilderInstance>();
const cssCodeCache = new Map<string, string>();

export const JssLoader = ({ extractCss = true }: JssLoaderOptions = {}): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;
    const minify = options.mode === 'production';
    const extractor = CssExtractor();

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      if (extractCss) {
        bundler.hooks.resolve.tap(pluginName, (args) => {
          if (args.namespace === 'file' && /\.jss\.css$/.test(args.path)) {
            return {
              path: args.path,
              namespace: pluginName,
            };
          }
        });

        bundler.hooks.load.tap(pluginName, (args) => {
          if (args.namespace !== pluginName) {
            return;
          }

          const cssCode = cssCodeCache.get(args.path);
          const error: ErrorData = {
            project: builder.name,
            name: 'JSS_EMPTY',
            message: `文件 ${args.path} 提取出的 CSS 代码为空`,
          };

          return {
            loader: 'css',
            resolveDir: dirname(args.path),
            contents: cssCode ?? '',
            errors: cssCode
              ? undefined
              : [
                  {
                    detail: error,
                    text: error.message,
                  },
                ],
          };
        });
      }

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== 'file' || !/\.jss\.(t|j)s$/.test(args.path)) {
          return;
        }

        // 入口则跳过
        if (args.path === options.entry) {
          return;
        }

        const childBuilder = jssLoaderCache.has(args.path)
          ? jssLoaderCache.get(args.path)!
          : await builder.createChild({
              entry: args.path,
              name: 'JSS',
              watch: options.watch,
              write: false,
              plugin: [extractor.plugin],
              logLevel: 'Silence',
            });

        if (!jssLoaderCache.has(args.path)) {
          jssLoaderCache.set(args.path, childBuilder);
        }

        /**
         *  TODO: 重复构建时如何加速
         * 比如 jss 和 script 里面同时有一个相同的入口，但是只是一个要 extract css 一个不需要，但是它们作为子进程的 build 是一样的
         */
        await childBuilder.build();

        const { cssCode, classes } = extractor.getOutput();
        const cssPath = replaceExt(args.path, '.css');
        const classesCode = minify
          ? JSON.stringify(classes ?? {})
          : JSON.stringify(classes ?? {}, null, 2);

        cssCodeCache.set(cssPath, cssCode);

        return {
          loader: 'js',
          contents: `
            ${extractCss ? `import '${cssPath}';` : ''}
            export default {
              classes: ${classesCode},
            };
          `,
        };
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      jssLoaderCache.clear();
      cssCodeCache.clear();
    });
  },
});
