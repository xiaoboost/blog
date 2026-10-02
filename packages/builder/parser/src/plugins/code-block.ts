import { parseQuery } from '@blog/node';
import type { Mdx } from '@blog/types';
import type { Plugin } from 'unified';
import { createExpression, createImport } from '../ast/mdx';

const scriptKinds: Partial<Record<string, string>> = {
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  js: 'js',
  javascript: 'js',
  jsx: 'jsx',
};

function booleanOption(value: unknown): boolean | undefined {
  return value === undefined ? undefined : value === true || value === 'true' || value === '';
}

/** 围栏参数优先于文章配置，未启用 LSP 的代码保留为普通围栏。 */
export const remarkTsCodeBlock: Plugin<[], Mdx.Root> = () => (tree, file) => {
  let usesTsCodeBlock = false;

  function transform(node: Mdx.Nodes): Mdx.Nodes {
    if (node.type === 'code') {
      const { base, query } = parseQuery(node.lang ?? '');
      const lang = scriptKinds[base.trim().toLowerCase()];
      const enableLsp = Boolean(lang) && (booleanOption(query.lsp) ?? file.data.lsp === true);
      const visible = booleanOption(query.visible) ?? true;

      if (!enableLsp) {
        return visible ? node : createExpression(null);
      }

      usesTsCodeBlock = true;
      const props = {
        lang,
        platform: query.platform === 'browser' || query.platform === 'node' ? query.platform : 'none',
        showError: booleanOption(query.showError) ?? true,
        visible,
        exportAs: typeof query.exportAs === 'string' ? query.exportAs : undefined,
      };
      const attributes: Mdx.MdxJsxAttribute[] = Object.entries(props)
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => {
          const expression = createExpression(value!);
          return {
            type: 'mdxJsxAttribute', name,
            value: { ...expression, type: 'mdxJsxAttributeValueExpression' },
          };
        });
      return {
        type: 'mdxJsxFlowElement', name: 'TsCodeBlock', attributes,
        children: [createExpression(node.value + '\n')], position: node.position,
      };
    }

    if ('children' in node) {
      node.children = node.children.map(transform) as typeof node.children;
    }

    return node;
  }

  transform(tree);

  if (usesTsCodeBlock) {
    tree.children.unshift(createImport(
      '@blog/mdx-code-block-typescript', new Set(['TsCodeBlock']),
    ));
  }
};
