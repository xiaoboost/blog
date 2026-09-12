import type { Mdx } from '@blog/types';

export function getChildrenContent(paragraph: Mdx.Nodes) {
  let content = '';

  if (!('children' in paragraph)) {
    return content;
  }

  for (const child of paragraph.children) {
    if (child.type === 'text') {
      content += child.value;
      continue;
    }
    else {
      content += getChildrenContent(child);
    }
  }

  return content;
}

export function getAttribute(
  name: string,
  attributes: (Mdx.MdxJsxAttribute | Mdx.MdxJsxExpressionAttribute)[],
) {
  return attributes.find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === name) as Mdx.MdxJsxAttribute | undefined;
}

export function getJsxNodesByTag(node: Mdx.Nodes, tag: string) {
  const nodes: (Mdx.MdxJsxFlowElement | Mdx.MdxJsxTextElement)[] = [];

  if (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') {
    if (node.name === tag) {
      nodes.push(node);
    }

    // 不再迭代子元素
    return nodes;
  }

  // 无子元素直接退出
  if (!('children' in node)) {
    return [];
  }

  for (const child of node.children ?? []) {
    nodes.push(...getJsxNodesByTag(child, tag));
  }

  return nodes;
}

export function visit(node: Mdx.Nodes, visitor: (node: Mdx.Nodes) => void) {
  visitor(node);

  // 迭代子节点
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children ?? []) {
      visit(child, visitor);
    }
  }
}
