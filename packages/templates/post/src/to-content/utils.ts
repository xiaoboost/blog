import { visit } from '@blog/parser/walk';
import type { Mdx } from '@blog/types';

/**
 * AST 文本提取
 */
export function getNodeText(node: any): string {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('');
  }

  if ('value' in node) {
    return String(node.value);
  }

  return '';
}

/** 保留已有标题 ID 的编码规则，不消耗标题计数。 */
export function encodeHeadAnchor(text: string) {
  return encodeURIComponent(text).toLowerCase();
}

/** ID 本身含百分号，作为 URL 片段时需要再次转义，浏览器解码后才能匹配。 */
export function getHeadHref(id: string) {
  return `#${encodeURIComponent(id)}`;
}

/** 每次正文或目录渲染使用独立计数，相同标题按文档序追加后缀。 */
export function createHeadAnchor() {
  const pointer = new Map<string, number>();

  return (text: string) => {
    const base = encodeHeadAnchor(text);
    const count = pointer.get(base) ?? 0;
    pointer.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

export interface HeadingAnchor {
  content: string;
  hash: string;
  level: number;
}

/** 目录和文章链接共用的标题表；查询不会改变正文渲染的计数。 */
export function getHeadingAnchors(ast: Mdx.Root): HeadingAnchor[] {
  const getHeadAnchor = createHeadAnchor();
  const headings: HeadingAnchor[] = [];

  visit(ast, (node) => {
    if (node.type === 'heading') {
      const content = getNodeText(node);
      headings.push({ content, hash: getHeadAnchor(content), level: node.depth });
    }
  });

  return headings;
}
