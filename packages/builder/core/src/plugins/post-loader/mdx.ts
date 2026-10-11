import { readFile } from 'fs/promises';
import { dirname } from 'path';
import { normalize } from '@blog/node';
import { transform } from '@blog/parser';
import type { BuilderPlugin } from '@blog/types';
import { parsePath } from '../../utils';
import { mdxMatcher } from './utils';

const pluginName = 'mdx-loader';

export const MdxLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options: opt } = builder;
    const mdxCache = new Map<string, string>();

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        const { basic, rawQuery } = parsePath(args.path);

        if (mdxMatcher.test(basic)) {
          const resolved = builder.resolve(basic, args);
          return {
            ...resolved,
            namespace: pluginName,
            sideEffects: false,
            external: false,
            path: normalize(resolved.path),
            suffix: rawQuery === undefined ? undefined : `?${rawQuery}`,
          };
        }
      });
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        return {
          contents: await readFile(args.path, 'utf-8'),
          source: { sourcePath: args.path, format: 'mdx' },
          watchFiles: [args.path],
          resolveDir: dirname(args.path),
        };
      });
      bundler.hooks.transform.tapPromise({ name: pluginName, stage: -100 }, async (input, ctx) => {
        if (input.module.id.namespace !== pluginName || input.format !== 'mdx' || !input.module.sourcePath) {
          return input;
        }

        const cacheKey = `${input.module.sourcePath}:\n${input.code}`;
        const code = mdxCache.get(cacheKey)
          ?? await transform(input.code, input.module.sourcePath, opt.mode === 'development');

        mdxCache.set(cacheKey, code);
        return ctx.update(input, { code, format: 'jsx', map: null });
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      mdxCache.clear();
    });
  },
});
