import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import * as path from 'path';

import { Parser, PostData, PostMeta } from './types';
import { toPinyin } from '@blog/shared/node';
import { GetComponentAssetMethodName, GetTemplateAssetMethodName } from '../../utils';

import type Mdx from '@mdx-js/mdx';

export async function getPostsInputCode(posts: string[]) {
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
    template: meta.template ?? 'post',
    description:
      meta.description ??
      mdContent
        .trim()
        .slice(0, 200)
        .replace(/[\n\r]/g, ''),
  };

  // 添加静态资源导出方法
  data.content += `\n\n${addAssetExport(data)}`;
  data.content += `\n\n${addTemplateExport(data)}`;

  // TODO: 还需要导出图片的语句

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

function addAssetExport(data: PostData) {
  const { content } = data;
  const importMatcher = /import[^'"]*['"](@blog\/mdx-[^'"]+)['"]/;
  const imports: string[] = [];

  let restContent = content;
  let result = importMatcher.exec(content);

  while (result) {
    restContent = restContent.substring((result.index ?? 0) + result[0].length);
    imports.push(result[1]);
    result = importMatcher.exec(restContent);
  }

  let exportCode = '';

  for (let i = 0; i < imports.length; i++) {
    exportCode += `import * as a${i} from '${imports[0]}'\n`;
  }

  exportCode += `\nexport function ${GetComponentAssetMethodName}() {\n  return [].concat(\n`;

  for (let i = 0; i < imports.length; i++) {
    exportCode += `    a${i}.getAssetNames(),\n`;
  }

  exportCode += '  );\n}\n';

  return exportCode;
}

function addTemplateExport(data: PostData) {
  return `
import * as template from '@blog/template-${data.template}'

export function ${GetTemplateAssetMethodName}() {
  return template.getAssetNames();
}
  `.trim();
}
