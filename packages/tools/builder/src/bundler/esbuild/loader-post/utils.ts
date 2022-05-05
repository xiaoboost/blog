import Glob from 'fast-glob';

import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import * as path from 'path';

import { Parser, PostData, PostMeta } from './types';
import { toPinyin } from '@blog/shared/node';

import type Mdx from '@mdx-js/mdx';

export async function getPostsInputCode(searcher: string) {
  const posts = await Glob(searcher);

  let code = '';

  for (let i = 0; i < posts.length; i++) {
    code += `import a${i} from '${posts[i]}';\n`;
  }

  code += `\nconst posts = [
    ${Array(posts.length)
      .fill(0)
      .map((_, i) => `a${i}`)
      .join(', ')}
  ]
    .sort((pre, next) => pre.create > next.create ? -1 : 1);

  export default posts;
  `;

  return code;
}

const parserThen: Promise<Parser> = Promise.all([
  eval("import('unified')"),
  eval("import('remark-mdx')"),
  eval("import('remark-parse')"),
  eval("import('remark-stringify')"),
]).then(([{ unified }, mdx, parse, stringify]) => {
  return unified().use(parse.default, { position: false }).use(stringify.default).use(mdx.default);
});

const compilerThen: Promise<typeof Mdx> = eval("import('@mdx-js/mdx')");

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

export async function getPostData(fileName: string): Promise<PostData> {
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
  const createAt = new Date(meta.create).getFullYear().toString();
  const decodeTitle = toPinyin(meta.title).toLowerCase();
  const data: PostData = {
    title: meta.title,
    create: new Date(meta.create).getTime(),
    update: meta.update ? new Date(meta.update).getTime() : (await fs.stat(fileName)).mtimeMs,
    tags: meta.tags ?? [],
    public: meta.public ?? true,
    content: postContent,
    pathname: meta.pathname ?? path.join('posts', createAt, decodeTitle),
    toc: meta.toc ?? true,
    ast: removePosition(parser.parse(postContent)),
    description:
      meta.description ??
      mdContent
        .trim()
        .slice(0, 200)
        .replace(/[\n\r]/g, ''),
  };

  return data;
}

export async function compileMdx(code: string) {
  return compilerThen
    .then((compiler) =>
      compiler.compile(code, {
        format: 'mdx',
        outputFormat: 'program',
      }),
    )
    .then((result) => result.toString());
}
