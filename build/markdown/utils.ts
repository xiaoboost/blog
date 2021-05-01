import { highlightLineClassName, codeSplitClassName } from './constant';

export function createNumberList(limit: number, highlightLines: Record<number, boolean>) {
  return new Array(limit).fill(0).map((_, i) => (
    highlightLines[i]
      ? `<li class="${highlightLineClassName}">${i + 1}</li>`
      : `<li>${i + 1}</li>`
  ));
}

/** 代码有多少前置空格 */
export function getLineSpaceWidth(str: string) {
  const result = /^ +/.exec(str);
  return result ? result[0].length : 0;
}

/** 分隔线元素 */
export const splitTag = `<span class="${codeSplitClassName}"></span>`;

/** 代码添加分割线 */
export function addSplitLabel(line: string, tabWidth: number) {
  let code = line;
  let index = 0;
  let realIndex = 0;

  if (line.trim().length === 0) {
    return splitTag;
  }

  while (realIndex < code.length) {
    if (code[realIndex] !== ' ') {
      break;
    }

    if (index % tabWidth !== 0) {
      index++;
      realIndex++;
      continue;
    }

    const before = code.substring(0, realIndex);
    const after = code.substring(realIndex);

    code = before + splitTag + after;

    index++;
    realIndex = realIndex + splitTag.length + 1;
  }

  return code;
}

/** 获取当前代码 tab 宽度 */
export function getMinSpaceWidth(str: string) {
  const result = str.trim().split('\n').reduce((ans, line) => {
    const space = getLineSpaceWidth(line);

    if (space <= 0) {
      return ans;
    }

    if (ans === 0 || space < ans) {
      return space;
    }
    else {
      return ans;
    }
  }, 0);

  const widths = [2, 4, 8, 16].sort((pre, next) => {
    const preRes = Math.abs(pre - result);
    const nextRes = Math.abs(next - result);

    return preRes < nextRes ? -1 : 1;
  });

  return widths[0];
}

/** 获取高亮代码行记录 */
export function getHighlightCode(code: string) {
  const hlLabel = /\/\*\*\* +hl +\*\*\*\//g;
  const highlightLines: Record<number, boolean> = {};
  const lines = code.trim().split(/[\n\r]/).map((line, index) => {
    const match = line.match(hlLabel);

    if (match) {
      line = line.replace(hlLabel, '');
      highlightLines[index] = true;
    }

    return line.trimRight();
  });

  return {
    code: lines.join('\n'),
    highlightLines,
  };
}
