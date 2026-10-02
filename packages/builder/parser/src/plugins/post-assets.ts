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

function callMethod(
  object: EsTree.Expression, name: string, args: EsTree.Expression[] = [],
): EsTree.CallExpression {
  return {
    type: 'CallExpression', optional: false,
    callee: {
      type: 'MemberExpression', object, property: { type: 'Identifier', name },
      computed: false, optional: false,
    },
    arguments: args,
  };
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
    createImport('@blog/context/runtime', new Set(['defineUtils'])),
  );

  let assets: EsTree.Expression = callMethod({ type: 'Identifier', name: 'template' }, 'getAssetNames');
  let code = 'template.getAssetNames()';
  if (components.length > 0) {
    assets = callMethod(assets, 'concat', components.map((_, i) => (
      callMethod({ type: 'Identifier', name: `c${i}` }, 'getAssetNames')
    )));
    code += `.concat(${components.map((_, i) => `c${i}.getAssetNames()`).join(', ')})`;
  }

  tree.children.unshift(...imports, createExport('utils', {
    type: 'CallExpression', callee: { type: 'Identifier', name: 'defineUtils' },
    arguments: [assets], optional: false,
  }, `defineUtils(${code})`));
};
