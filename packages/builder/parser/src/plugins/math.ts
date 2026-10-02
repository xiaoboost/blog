import type { Mdx } from '@blog/types';
import type { Plugin } from 'unified';
import { createExpression, createImport } from '../ast/mdx';

/** 在 remark 的转换阶段，将公式节点替换为 MDX 组件。 */
export const remarkMathComponents: Plugin<[], Mdx.Root> = () => (tree) => {
  const imports = new Set<string>();

  function transform(node: Mdx.Nodes): Mdx.Nodes {
    if (node.type === 'math' || node.type === 'inlineMath') {
      const component = node.type === 'math' ? 'MathBlock' : 'MathInline';
      imports.add(component);
      const expression = createExpression(node.value);
      return node.type === 'math'
        ? {
          type: 'mdxJsxFlowElement', name: component, attributes: [],
          children: [expression], position: node.position,
        }
        : {
          type: 'mdxJsxTextElement', name: component, attributes: [],
          children: [{ ...expression, type: 'mdxTextExpression' }], position: node.position,
        };
    }

    if ('children' in node) {
      node.children = node.children.map(transform) as typeof node.children;
    }
    return node;
  }

  transform(tree);

  if (imports.size) {
    tree.children.unshift(createImport('@blog/mdx-katex', imports));
  }
};
