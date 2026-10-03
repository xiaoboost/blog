import type { Mdx, EsTree } from '@blog/types';
import type { Plugin } from 'unified';
import { createExport, createImport } from '../ast/mdx';

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

/** 在组件转换之后收集 import，并把模板和组件资源合并为 utils。 */
export const remarkPostAssets: Plugin<[], Mdx.Root> = () => (tree, file) => {
  const { template } = file.data;
  // 普通 MDX 编译没有文章配置。
  if (typeof template !== 'string') {
    return;
  }

  const components = getImportComponentNode(tree);
  const imports = components.map((name, i) => createImport(name, new Map([['utils', `c${i}`]])));
  imports.push(
    createImport(`@blog/template-${template}`, new Map([['utils', 'template']])),
    createImport('@blog/context/runtime', new Set(['mergeUtils'])),
  );

  const sources = ['template', ...components.map((_, i) => `c${i}`)];

  tree.children.unshift(...imports, createExport('utils', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'mergeUtils' },
    arguments: sources.map((name): EsTree.Identifier => ({ type: 'Identifier', name })), optional: false,
  }, `mergeUtils(${sources.join(', ')})`));
};
