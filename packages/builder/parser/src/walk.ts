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
