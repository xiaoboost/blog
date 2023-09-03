import type { Mdx } from '@blog/types';

export function getChildrenContent(paragraph: Mdx.Syntax) {
  let content = '';

  if (!('children' in paragraph)) {
    return content;
  }

  for (const child of paragraph.children) {
    if (child.type === 'text') {
      content += child.value;
      continue;
    } else {
      content += getChildrenContent(child);
    }
  }

  return content;
}

export function getAttribute(name: string, attributes: Mdx.JsxAttribute[]) {
  return attributes.find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === name);
}

export function getJsxNodesByTag(node: Mdx.Syntax, tag: string) {
  const nodes: (Mdx.JsxFlowElement | Mdx.JsxTextElement)[] = [];

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
