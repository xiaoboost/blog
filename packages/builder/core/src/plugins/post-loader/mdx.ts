import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { readFile } from 'fs/promises';
import { transform } from '@blog/parser';
import { mdxMatcher } from './utils';

const pluginName = 'mdx-loader';

export const MdxLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const mdxCache = new Map<string, string>();

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (mdxMatcher.test(args.path)) {
          return {
            namespace: pluginName,
            sideEffects: false,
            external: false,
            path: args.path,
          };
        }
      });
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const content = await readFile(args.path, 'utf-8');
        const cacheKey = `${args.path}:\n${content}`;
        const cacheCode = mdxCache.get(cacheKey);
        const basicResult = {
          loader: 'js' as const,
          watchFiles: [args.path],
          resolveDir: dirname(args.path),
        };

        if (cacheCode) {
          return {
            ...basicResult,
            contents: cacheCode,
          };
        }

        const code = await transform(content, args.path);

        mdxCache.set(cacheKey, code);

        return {
          ...basicResult,
          contents: code,
          loader: 'jsx',
          pluginData: {
            transformed: code,
          },
        };
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      mdxCache.clear();
    });
  },
});
