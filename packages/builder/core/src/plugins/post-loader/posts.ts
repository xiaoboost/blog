import { realpath } from 'fs/promises';
import { join } from 'path';
import { normalize } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';

import Glob from 'fast-glob';
import { lookItUp } from 'look-it-up';
import { getPostsInputCode } from './utils';

const pluginName = 'posts-loader';

export const PostsLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (!/^@blog\/posts$/.test(args.path)) {
          return;
        }

        const postDir = await lookItUp('node_modules/@blog/posts', args.resolveDir);
        const realPostDir = await realpath(postDir ?? '');

        return {
          namespace: pluginName,
          sideEffects: false,
          external: false,
          path: 'virtual:@blog/posts',
          pluginData: realPostDir,
        };
      });

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const realPostDir: string = args.pluginData;
        const packageFile = join(realPostDir, 'package.json');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const packageJson = require(packageFile);

        if (!packageJson.main) {
          return {
            errors: [
              {
                text: `文件 ${packageFile} 中未发现合法的 main 字段`,
                pluginName,
              },
            ],
            contents: 'export default []',
            resolveDir: realPostDir,
          };
        }

        const postSearchers = [packageJson.main];

        // 内部样张只进入开发构建，避免随正式文章一起发布。
        if (builder.options.mode === 'development' && packageJson.devMain) {
          postSearchers.push(packageJson.devMain);
        }

        const postFiles = await Glob(
          postSearchers.map((pattern) => normalize(join(realPostDir, pattern))),
        );

        return {
          contents: getPostsInputCode(postFiles),
          resolveDir: realPostDir,
        };
      });
    });
  },
});
