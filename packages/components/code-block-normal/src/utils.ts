import styles from './index.jss';

const langLabel = {
  html: 'HTML',
  js: 'JavaScript',
  jsx: 'JavaScript React',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript React',
  typescript: 'TypeScript',
  c: 'C',
  'c++': 'C++',
  'c#': 'C#',
  c艹: 'C++',
  python: 'Python',
  bash: 'Bash',
  haskell: 'Haskell',
  json: 'JSON',
};

/** 获取高亮代码行数据 */
export function getHighlightCode(code: string) {
  const hlLabel = /\/\*\*\* +hl +\*\*\*\//g;
  const highlightLines: Record<number, boolean> = {};
  const lines = code
    .trim()
    .split(/[\n\r]/)
    .map((line, index) => {
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

export function getLangLabel(lang: string) {
  return langLabel[lang.toLowerCase()] ?? '';
}

/** 代码有多少前置空格 */
export function getLineSpaceWidth(str: string) {
  const result = /^ +/.exec(str);
  return result ? result[0].length : 0;
}

/** 分隔线元素 */
export const splitTag = `<span class="${styles.classes.codeBlockSplit}"></span>`;

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
  const result = str
    .trim()
    .split('\n')
    .reduce((ans, line) => {
      const space = getLineSpaceWidth(line);

      if (space <= 0) {
        return ans;
      }

      if (ans === 0 || space < ans) {
        return space;
      } else {
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
