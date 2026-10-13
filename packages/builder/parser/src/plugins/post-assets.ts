import type { Mdx, EsTree } from '@blog/types';
import type { Plugin } from 'unified';
import { createExport, createImport } from '../ast/mdx';

function getImportComponentNode(ast: Mdx.Root) {
  const importSet = new Set<string>();
  const assets = new Set<string>();

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

        // assets: 默认导出资源列表，沿用作者已有的导入变量。
        if (importSource.startsWith('assets:')) {
          const specifier = item.specifiers.find((item) => item.type === 'ImportDefaultSpecifier');

          if (specifier) {
            assets.add(specifier.local.name);
          }
        }

        if (!importSource.startsWith('@blog/mdx-')) {
          continue;
        }

        importSet.add(importSource);
      }
    }
  }

  return { components: Array.from(importSet), assets: Array.from(assets) };
}

/** 在组件转换之后收集 import，并把模板和组件资源合并为 utils。 */
export const remarkPostAssets: Plugin<[], Mdx.Root> = () => (tree, file) => {
  const { template } = file.data;

  // 普通 MDX 编译没有文章配置。
  if (typeof template !== 'string') {
    return;
  }

  const { components, assets } = getImportComponentNode(tree);
  const imports = components.map((name, i) => createImport(name, new Map([['utils', `c${i}`]])));

  imports.push(
    createImport(`@blog/template-${template}`, new Map([['utils', 'template']])),
    createImport('@blog/context/runtime', new Set(['mergeUtils', 'defineUtils'])),
  );

  const sources = ['template', ...components.map((_, i) => `c${i}`)];
  const assetCalls: EsTree.CallExpression[] = assets.map((name) => ({
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'defineUtils' },
    arguments: [{ type: 'Identifier', name }],
    optional: false,
  }));

  tree.children.unshift(...imports);
  // 放在原有 import 之后，转成 CommonJS 时也能先取得资源列表。
  tree.children.push(createExport('utils', {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'mergeUtils' },
    arguments: [
      ...sources.map((name): EsTree.Identifier => ({ type: 'Identifier', name })),
      ...assetCalls,
    ],
    optional: false,
  }, `mergeUtils(${[...sources, ...assets.map((name) => `defineUtils(${name})`)].join(', ')})`));
};
