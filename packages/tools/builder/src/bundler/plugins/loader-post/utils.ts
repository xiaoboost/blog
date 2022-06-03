import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import * as path from 'path';

import { toPinyin, Fixer } from '@blog/shared/node';
import { isUndef } from '@xiao-ai/utils';
import { Parser, PostData, PostMeta, Root, Node, Image } from './types';
import { decodeTemplate } from './template';
import {
  BuildError,
  GetComponentAssetMethodName,
  GetTemplateAssetMethodName,
  GetPostAssetMethodName,
} from '../../utils';

import type Mdx from '@mdx-js/mdx';
import type * as ESTree from 'estree';

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

const pluginThen: Promise<any[]> = Promise.all([eval("import('remark-gfm')")]).then((val) => {
  return val.map((i) => i.default);
});

const compilerThen: Promise<typeof Mdx> = eval("import('@mdx-js/mdx')");

function visit(root: Root, cb: (node: Node) => void) {
  cb(root as any);

  for (const no of root.children ?? []) {
    visit(no as any, cb);
  }
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
    ast: parseToAst(parser, fileName, postContent),
    template: meta.template ?? 'post',
    description:
      meta.description ??
      mdContent
        .trim()
        .slice(0, 200)
        .replace(/[\n\r]/g, ''),
  };

  const fixer = new Fixer(data.content);

  addComponentExport(data, fixer);
  addTemplateExport(data, fixer);
  addPostAssetExport(data, fixer);

  data.content = fixer.apply();
  data.ast = parseToAst(parser, `${fileName}.js`, data.content);

  return data;
}

export async function compileMdx(code: string) {
  const [compiler, plugins] = await Promise.all([compilerThen, pluginThen]);
  const jsxCode = await compiler.compile(code, {
    format: 'mdx',
    jsx: false,
    outputFormat: 'program',
    remarkPlugins: plugins,
  });

  return decodeTemplate(jsxCode.toString());
}

function getImportComponentNod(ast: Root) {
  const importSet = new Set<string>();

  // 只会在首层存在
  for (const node of ast.children) {
    if ((node as any).type === 'mdxjsEsm' && node.data?.estree) {
      const esNode = node.data?.estree as ESTree.Node;

      if (esNode.type !== 'Program') {
        continue;
      }

      const firstNode = esNode.body[0];

      if (firstNode.type !== 'ImportDeclaration') {
        continue;
      }

      const importSource = String(firstNode.source.value ?? '');

      if (!importSource.startsWith('@blog/mdx-')) {
        continue;
      }

      importSet.add(importSource);
    }
  }

  return importSet;
}

function addComponentExport(data: PostData, fixer: Fixer) {
  const importSet = getImportComponentNod(data.ast);
  const imports = Array.from(importSet.values());

  let exportCode = '';

  for (let i = 0; i < imports.length; i++) {
    exportCode += `import * as a${i} from '${imports[0]}'\n`;
  }

  exportCode += `export function ${GetComponentAssetMethodName}() {\n  return [].concat(\n`;

  for (let i = 0; i < imports.length; i++) {
    exportCode += `    a${i}.getAssetNames(),\n`;
  }

  exportCode += '  );\n}\n\n';

  fixer.insert(exportCode);
}

function addTemplateExport(data: PostData, fixer: Fixer) {
  fixer.insert(
    `import * as template from '@blog/template-${data.template}'
export function ${GetTemplateAssetMethodName}() {
  return template.getAssetNames();
}\n\n`,
  );
}

function addPostAssetExport(data: PostData, fixer: Fixer) {
  const images: Image[] = [];

  visit(data.ast, (node) => {
    if (node.type === 'image') {
      images.push(node as Image);
    }
  });

  // 没有静态资源时，插入空函数
  if (images.length === 0) {
    fixer.insert(`export function ${GetPostAssetMethodName}() {\n  return [];\n}\n\n`);
    return;
  }

  let importCode = `import { getAssetContents } from '@blog/shared/node'\n`;
  let exportCode = `export function ${GetPostAssetMethodName}() {\n  return getAssetContents([\n`;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // 跳过链接
    if (/^https?:\/\//.test(img.url)) {
      continue;
    }

    if (!img.position) {
      throw new Error(`图片解析错误，未获得图片节点位置：${img.url}`);
    }

    importCode += `import img${i} from '${img.url}'\n`;
    exportCode += `    img${i},\n`;

    // 虚拟模板字符串
    const imgCode = img.title
      ? `![${img.alt}](\`\${img${i}.path}\` "${img.title}")`
      : `![${img.alt}](\`\${img${i}.path}\`)`;

    fixer.fix({
      start: img.position.start.offset!,
      end: img.position.end.offset!,
      newText: imgCode,
    });
  }

  exportCode += '  ]);\n}\n\n';

  fixer.insert(importCode);
  fixer.insert(exportCode);
}

function parseToAst(parser: Parser, file: string, content: string) {
  try {
    return parser.parse(content);
  } catch (err: any) {
    const data: BuildError = {
      file,
      content,
      label: err.source,
      message: err.message,
      position: err.position,
    };

    if (isUndef(data.position.end?.line)) {
      data.position.end = undefined;
    }

    throw data;
  }
}
