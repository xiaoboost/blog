import { PostData, Mdx, EsTree } from '@blog/types';
import { Fixer } from '@blog/shared';

import {
  GetComponentAssetMethodName,
  GetTemplateAssetMethodName,
  GetPostAssetMethodName,
} from './constant';

interface VisitNode {
  type: string;
}

export function visit(root: Mdx.Root, cb: (node: VisitNode) => void) {
  cb(root as any);

  for (const no of root.children ?? []) {
    visit(no as any, cb);
  }
}

export function getImportComponentNode(ast: Mdx.Root) {
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

export function addComponentExport(data: PostData, fixer: Fixer) {
  const importSet = getImportComponentNode(data.ast);
  const imports = Array.from(importSet.values());

  let exportCode = '';

  for (let i = 0; i < imports.length; i++) {
    exportCode += `import * as a${i} from '${imports[0]}'\n`;
  }

  exportCode += `export function ${GetComponentAssetMethodName}() {\n  return [].concat(\n`;

  for (let i = 0; i < imports.length; i++) {
    exportCode += `    a${i}?.getAssetNames?.() ?? [],\n`;
  }

  exportCode += '  );\n}\n\n';

  fixer.insert(exportCode);
}

export function addTemplateExport(data: PostData, fixer: Fixer) {
  fixer.insert(
    `import * as template from '@blog/template-${data.template}'
export function ${GetTemplateAssetMethodName}() {
  return template?.getAssetNames?.() ?? [];
}\n\n`,
  );
}

export function addPostAssetExport(data: PostData, fixer: Fixer) {
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
