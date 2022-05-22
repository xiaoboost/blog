import type { PluginBuild } from 'esbuild';

import Glob from 'fast-glob';

import { normalize } from '@blog/shared/node';
import { FilePlugin } from '../record-file';
import { getPostsInputCode, getPostData, compileMdx } from './utils';
import {
  GetComponentAssetMethodName,
  GetTemplateAssetMethodName,
  GetPostAssetMethodName,
} from '../../utils';

import * as lookup from 'look-it-up';
import * as path from 'path';

const postsNamespace = 'posts-loader';
const mdxNamespace = 'mdx-loader';

export function PostLoader(): FilePlugin {
  let posts: string[] = [];

  return {
    getFiles: () => posts.slice(),
    plugin: {
      name: 'posts-loader',
      setup(build: PluginBuild) {
        const mdxContents = new Map<string, string>();
        const mdxComponentSuffix = '.mdx-js';

        build.onResolve({ filter: /^@blog\/posts$/ }, async (args) => {
          const postDir = await lookup.lookItUp('node_modules/@blog/posts', args.resolveDir);

          return {
            namespace: postsNamespace,
            sideEffects: false,
            external: false,
            path: postDir ?? '',
          };
        });

        build.onResolve({ filter: new RegExp(`\\${mdxComponentSuffix}$`) }, (args) => {
          return {
            namespace: mdxNamespace,
            sideEffects: false,
            external: false,
            path: args.path,
          };
        });

        build.onLoad({ filter: /.*/, namespace: postsNamespace }, async (args) => {
          const packageFile = path.join(args.path, 'package.json');
          const packageJson = require(path.join(args.path, 'package.json'));

          if (!packageJson.main) {
            throw new Error(`文件 ${packageFile} 中未发现合法的 main 字段`);
          }

          const postSearcher = path.join(args.path, packageJson.main);
          const postFiles = await Glob(normalize(postSearcher));
          const code = await getPostsInputCode(postFiles);

          posts = postFiles.slice();

          return {
            contents: code,
            resolveDir: args.path,
          };
        });

        build.onLoad({ filter: /.*/, namespace: mdxNamespace }, async (args) => {
          const mdxPath = normalize(args.path);
          const content = mdxContents.get(mdxPath);
          const renderCode = await compileMdx(content ?? '');

          mdxContents.delete(mdxPath);

          return {
            loader: 'js',
            contents: renderCode,
            resolveDir: path.dirname(args.path),
          };
        });

        build.onLoad({ filter: /\.mdx?$/ }, async (args) => {
          const { content, ...post } = await getPostData(args.path);
          const mdxPath = normalize(`${args.path}${mdxComponentSuffix}`);

          mdxContents.set(mdxPath, content);

          return {
            loader: 'js',
            watchFiles: [args.path],
            resolveDir: path.dirname(args.path),
            contents: `
            import Component, {
              ${GetComponentAssetMethodName},
              ${GetTemplateAssetMethodName},
              ${GetPostAssetMethodName},
            } from '${mdxPath}';

            export default {
              Component,
              ${GetComponentAssetMethodName},
              ${GetTemplateAssetMethodName},
              ${GetPostAssetMethodName},
              ...(${JSON.stringify(post, null, 2)}),
            };
          `,
          };
        });
      },
    },
  };
}
