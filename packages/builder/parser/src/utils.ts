import type { Fixer } from '@blog/shared';
import type { PostData, Mdx, EsTree } from '@blog/types';

function getImportComponentNode(ast: Mdx.Root) {
  const importSet = new Set<string>();

  // 只会在首层存在
  for (const node of ast.children) {
    if (node.type === 'mdxjsEsm' && node.data?.estree) {
      const esNode = node.data?.estree as EsTree.Node;

      if (esNode.type !== 'Program') {
        continue;
      }

      for (const item of esNode.body) {
        if (item.type !== 'ImportDeclaration') {
          continue;
        }

        const importSource = String(item.source.value ?? '');

        if (!importSource.startsWith('@blog/mdx-')) {
          continue;
        }

        importSet.add(importSource);
      }
    }
  }

  return Array.from(importSet.values());
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
  code += 'import { defineUtils } from \'@blog/context/runtime\';\n';

  // 添加导出语句
  if (components.length === 0) {
    code += 'export const utils = defineUtils(template.getAssetNames());\n\n';
  }
  else {
    code += `export const utils = defineUtils(template.getAssetNames().concat(
${components.map((_, i) => `  c${i}.getAssetNames(),`).join('\n')}
));\n\n`;
  }

  fixer.insert(code);
}
