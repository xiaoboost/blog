import type { BuilderPlugin } from '@blog/types';
import { lookItUp } from 'look-it-up';
import { join } from 'path';
import { normalize } from '@blog/node';
import { getImportCode } from '@blog/parser';

import Glob from 'fast-glob';

const pluginName = 'posts-loader';

function getPostsInputCode(posts: string[]) {
  let code = '';

  for (let i = 0; i < posts.length; i++) {
    code += getImportCode(posts[i], `post_${i}`);
  }

  code += `\nconst posts = [
  ${Array(posts.length)
    .fill(0)
    .map((_, i) => `post_${i}`)
    .join(', ')}
].sort((pre, next) => pre.create > next.create ? -1 : 1);

export default posts;
`;

  return code;
}

export const PostsLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (!/^@blog\/posts$/.test(args.path)) {
          return;
        }

        const postDir = await lookItUp('node_modules/@blog/posts', args.resolveDir);

        return {
          namespace: pluginName,
          sideEffects: false,
          external: false,
          path: postDir ?? '',
        };
      });

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const packageFile = join(args.path, 'package.json');
        const packageJson = require(join(args.path, 'package.json'));

        if (!packageJson.main) {
          return {
            errors: [
              {
                text: `文件 ${packageFile} 中未发现合法的 main 字段`,
                pluginName,
              },
            ],
            contents: 'export default []',
            resolveDir: args.path,
          };
        }

        const postSearcher = join(args.path, packageJson.main);
        const postFiles = await Glob(normalize(postSearcher));

        return {
          contents: getPostsInputCode(postFiles),
          resolveDir: args.path,
        };
      });
    });
  },
});
