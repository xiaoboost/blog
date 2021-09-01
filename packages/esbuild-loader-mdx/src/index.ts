import { PluginBuild } from 'esbuild';
import { promises as fs } from 'fs';
import { Parser, PostData, PostMeta } from './types';
import { toPinyin, normalize } from '@blog/utils';

import mdx from '@mdx-js/mdx';

import * as path from 'path';
import * as yaml from 'yaml';

export * from './types';

const rendered = `
import React from 'react';
import {mdx} from '@mdx-js/react';
`;

const pragma = `
/* @jsxRuntime classic */
/* @jsx mdx */
/* @jsxFrag mdx.Fragment */
`;

const parserThen: Promise<Parser> = Promise.all([
  eval('import(\'unified\')'),
  eval('import(\'remark-mdx\')'),
  eval('import(\'remark-parse\')'),
  eval('import(\'remark-stringify\')'),
])
  .then(([{ unified }, mdx, parse, stringify]) => {
    return unified()
      .use(parse.default, { position: false })
      .use(stringify.default)
      .use(mdx.default);
  });

function removePosition(node: any) {
  if (node.position) {
    delete node.position;
  }

  if (node.children) {
    for (const child of node.children) {
      removePosition(child);
    }
  }

  return node;
}

async function getPostData(fileName: string): Promise<PostData> {
  const content = await fs.readFile(fileName, 'utf-8');
  const result = content.match(/^---([\d\D]+?)---([\d\D]*)$/);

  if (!result) {
    throw {
      message: `文件格式错误: ${fileName}`,
    };
  }

  const [, metaStr, mdContent] = result;
  const meta = yaml.parse(metaStr) as PostMeta;

  if (!meta) {
    throw {
      message: `缺失文章属性: ${fileName}`,
    };
  }

  // 检查必填属性
  const required = ['create', 'title'].filter((key) => !meta[key]);

  if (required.length > 0) {
    throw {
      message: `文章必须要有 [${required.join(', ')}] 字段`,
    };
  }

  const parser = await parserThen;
  const postContent = (mdContent ?? '').trim();
  const createAt = (new Date(meta.create)).getFullYear().toString();
  const decodeTitle = toPinyin(meta.title).toLowerCase();
  const data: PostData = {
    title: meta.title,
    create: new Date(meta.create).getTime(),
    update: meta.update
      ? new Date(meta.update).getTime()
      : (await fs.stat(fileName)).mtimeMs,
    tags: meta.tags ?? [],
    public: meta.public ?? true,
    content: postContent,
    pathname: meta.pathname ?? path.join('posts', createAt, decodeTitle),
    toc: meta.toc ?? true,
    ast: removePosition(parser.parse(postContent)),
    description: meta.description
      ?? mdContent.trim().slice(0, 200).replace(/[\n\r]/g, ''),
  };

  return data;
}

export function MdxLoader() {
  return {
    name: 'loader-mdx',
    setup(esbuild: PluginBuild) {
      const namespace = 'loader-mdx';
      const mdxMatcher = /\.mdx?$/;
      const mdxJsxMatcher = /\.mdx?-jsx$/;
      const mdxContents: Record<string, string> = {};
      // const { initialOptions: options } = esbuild;
      // const publicPath = options.publicPath ?? '/';
      // const getName = getNameCreator(options.assetNames ?? '[name]');

      esbuild.onResolve({ filter: mdxMatcher }, (args) => ({
        namespace,
        path: path.resolve(args.resolveDir, args.path),
      }));

      esbuild.onResolve({ filter: mdxJsxMatcher }, (args) => ({
        namespace,
        path: path.resolve(args.resolveDir, args.path),
      }));

      esbuild.onLoad({ filter: mdxJsxMatcher }, async (args) => {
        const content = mdxContents[normalize(args.path)];
        const renderCode = await mdx(content);
        return {
          loader: 'jsx',
          contents: `${rendered}${pragma}${renderCode}`,
          resolveDir: path.dirname(args.path),
        };
      });

      esbuild.onLoad({ filter: mdxMatcher, namespace }, async (args) => {
        const post = await getPostData(args.path);
        const mdxJsxPath = normalize(`${args.path}-jsx`);
        const { content, ...rest } = post;

        mdxContents[mdxJsxPath] = content;

        return {
          loader: 'js',
          watchFiles: [args.path],
          resolveDir: path.dirname(args.path),
          contents: `
          import Render from '${mdxJsxPath}';
          export default {
            Render: Render,
            ...(${JSON.stringify(rest, null, 2)}),
          };`,
        };
      });
    },
  };
}
