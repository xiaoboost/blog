import { PostData, Mdx, EsTree } from '@blog/types';
import { Fixer } from '@blog/shared';

interface VisitNode {
  type: string;
}

function visit(root: Mdx.Root, cb: (node: VisitNode) => void) {
  cb(root as any);

  for (const no of root.children ?? []) {
    visit(no as any, cb);
  }
}

function getImportComponentNode(ast: Mdx.Root) {
  const importSet = new Set<string>();

  // 只会在首层存在
  for (const node of ast.children) {
    if ((node as any).type === 'mdxjsEsm' && node.data?.estree) {
      const esNode = node.data?.estree as EsTree.Node;

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

function getImages(ast: Mdx.Root) {
  const images: Mdx.Image[] = [];

  visit(ast, (node) => {
    if (node.type === 'image') {
      images.push(node as Mdx.Image);
    }
  });

  return images;
}

function addPostAssetVar(data: PostData, fixer: Fixer) {
  const images: Mdx.Image[] = [];

  visit(data.ast, (node) => {
    if (node.type === 'image') {
      images.push(node as Mdx.Image);
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

/** 将文章的资源引用转为 import 语句 */
export function addPostAssetImport(data: PostData, fixer: Fixer) {
  const images = getImages(data.ast);

  // TODO:
}

/** 为文章添加 templateUtils 方法的导出 */
export function addTemplateUtilsExport(data: PostData, fixer: Fixer) {
  const components = Array.from(getImportComponentNode(data.ast).values());
  const templateName = `@blog/template-${data.template}`;

  let code = '';

  // 添加组件引用语句
  code += components.map((name, i) => `import { utils as c${i} } from '${name}';\n`).join('');

  // 添加模板引用语句
  code += `import { utils as template } from '${templateName}';\n`;

  // 添加工具函数
  code += `import { defineUtils } from '@blog/context/runtime';\n`;

  // 添加导出语句
  code += `export const utils = defineUtils(template.getAssetNames().concat([\n
    ${components.map((_, i) => `  c${i}.getAssetNames(),\n`).join('')}
  ]));\n\n`;

  fixer.insert(code);
}
