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

/** 标题 Anchor 计数器 */
const anchorPointer = new Map<string, number>();

/** 重置计数 */
export function resetAnchorPointer() {
  anchorPointer.clear();
}

/** 按文档序消费 hash，相同内容自动去重加后缀 */
export function getHeadAnchor(str: string) {
  const base = encodeURIComponent(str).toLowerCase();
  const count = anchorPointer.get(base) ?? 0;
  anchorPointer.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}
