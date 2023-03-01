import type { BuilderPlugin, ErrorData } from '@blog/types';
import { extname } from 'path';
import { createResolver } from '../utils';

const pluginName = 'resolver';
const defaultExts = ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.css'];

export const Resolver = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { root } = builder;
    const resolve = createResolver({
      root,
    });

    builder.resolve = resolve;

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap({ name: pluginName, stage: 999 }, (args) => {
        const result = resolve(args.path, args);
        const ext = extname(result.path);

        if (ext && !defaultExts.includes(ext)) {
          const err: ErrorData = {
            project: builder.name,
            name: 'RESOLVE_FAILED',
            filePath: args.importer,
            message: `未知的文件后缀：'${ext}'，原始请求为：'${args.path}'`,
          };

          throw err;
        }

        return result;
      });
    });
  },
});
