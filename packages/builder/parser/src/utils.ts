import { PostData, Mdx, EsTree } from '@blog/types';
import { Fixer, isUrl } from '@blog/shared';
import { encodeImageTemplate } from './template';

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
    if (node.type === 'mdxjsEsm' && node.data?.estree) {
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

  return Array.from(importSet.values());
}

function addImageImport(ast: Mdx.Root, fixer: Fixer) {
  const images: Mdx.Image[] = [];

  // 查询 Image 节点
  visit(ast, (node) => {
    if (node.type === 'image') {
      images.push(node as Mdx.Image);
    }
  });

  let importCode = '';

  // 迭代 Image 节点
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // 跳过链接
    if (isUrl(img.url)) {
      continue;
    }

    if (!img.position) {
      throw new Error(`图片解析错误，未获得图片节点位置：${img.url}`);
    }

    importCode += `import img${i} from '${img.url}';\n`;

    // 虚拟模板字符串
    const imgCode = img.title
      ? `![${img.alt}](${encodeImageTemplate(`img${i}`)} "${img.title}")`
      : `![${img.alt}](${encodeImageTemplate(`img${i}`)})`;

    fixer.fix({
      start: img.position.start.offset!,
      end: img.position.end.offset!,
      newText: imgCode,
    });
  }

  fixer.insert(importCode);
}

/** 引用资源添加 import 语句 */
export function addPostAssetImport(data: PostData, fixer: Fixer) {
  addImageImport(data.ast, fixer);
}

/** 导出 templateUtils 方法 */
export function addTemplateUtilsExport(data: PostData, fixer: Fixer) {
  const components = getImportComponentNode(data.ast);
  const templateName = `@blog/template-${data.template}`;

  let code = '';

  // 添加组件引用语句
  code += components.map((name, i) => `import { utils as c${i} } from '${name}';\n`).join('');

  // 添加模板引用语句
  code += `import { utils as template } from '${templateName}';\n`;

  // 添加工具函数
  code += `import { defineUtils } from '@blog/context/runtime';\n`;

  // 添加导出语句
  if (components.length === 0) {
    code += `export const utils = defineUtils(template.getAssetNames());\n\n`;
  } else {
    code += `export const utils = defineUtils(template.getAssetNames().concat([
${components.map((_, i) => `  c${i}.getAssetNames(),`).join('\n')}
]));\n\n`;
  }

  fixer.insert(code);
}
