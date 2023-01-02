import type { BuilderPlugin, ErrorData } from '@blog/types';
import { replaceExt } from '@blog/node';
import { dirname } from 'path';
import { cssCodeCache, builderCache } from './store';
import { getJssBuilder, cssClassesName, cssFileName } from './builder';

export interface JssLoaderOptions {
  extractCss?: boolean;
}

const pluginName = 'jss-loader';

export const JssLoader = ({ extractCss = true }: JssLoaderOptions = {}): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    /**
     * 提取 CSS 文件
     *   - 加载生成 css 文件，并重命名生成的文件
     */
    if (extractCss) {
      builder.hooks.bundler.tap(pluginName, (bundler) => {
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
      });
    }

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== 'file' || !/\.jss\.(t|j)s$/.test(args.path)) {
          return;
        }

        // 入口则跳过
        if (args.path === builder.options.entry) {
          return;
        }

        const jssBuilder = await getJssBuilder(args.path, builder);
        const cssFilePath = replaceExt(args.path, '.css');

        let classesCode = '{}';

        for (const asset of jssBuilder.getAssets()) {
          if (asset.path === cssClassesName) {
            classesCode = asset.content.toString('utf-8');
          }

          if (asset.path === cssFileName) {
            cssCodeCache.set(cssFilePath, asset.content.toString('utf-8'));
          }

          // 其余资源上报
          builder.emitAsset(asset);
        }

        return {
          loader: 'js',
          contents: `
            ${extractCss ? `import '${cssFilePath}';` : ''}
            export default {
              classes: ${classesCode},
            };
          `,
        };
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      cssCodeCache.clear();
      builderCache.clear();
    });
  },
});
