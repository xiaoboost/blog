/** 按文字行框命中，段落周围的空白仍可拖动。 */
export function hitsText(event: PointerEvent): boolean {
  if (!(event.target instanceof Element)) {
    return false;
  }

  const document = event.target.ownerDocument;
  const walker = document.createTreeWalker(event.target, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (!node.textContent?.trim()) {
      continue;
    }

    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom) {
        return true;
      }
    }
  }
  return false;
}
