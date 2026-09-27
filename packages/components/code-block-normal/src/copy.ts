/** 在 HTTPS 和本地 HTTP 预览中均可复制。 */
export async function copyCode(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    }
    catch {
      // 权限受限时继续尝试同步复制。
    }
  }

  const focused = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from(
      { length: selection.rangeCount },
      (_, index) => selection.getRangeAt(index).cloneRange(),
    )
    : [];
  const input = document.createElement('textarea');

  input.value = text;
  input.readOnly = true;
  input.tabIndex = -1;
  input.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px;';
  document.body.appendChild(input);

  try {
    input.select();
    if (!document.execCommand('copy')) {
      throw new Error('复制失败');
    }
  }
  finally {
    input.remove();
    if (focused instanceof HTMLElement) {
      focused.focus({ preventScroll: true });
    }
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}
