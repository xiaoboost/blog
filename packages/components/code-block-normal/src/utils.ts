import styles from './index.jss';

const langLabel: Record<string, string> = {
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

/**
 * 格式化代码
 *   - 前后空行
 *   - 作为代码块的左侧统一空格
 */
export function formatCode(code: string) {
  const lines = code.replace(/\r/g, '').split(/[\n\r]/);

  while (lines[0].trim().length === 0) {
    lines.shift();
  }

  while (lines[lines.length - 1].trim().length === 0) {
    lines.pop();
  }

  const clearedSpaceLines = lines.map((line) => {
    return /^\s+$/.test(line) ? '' : line;
  });

  const blockLeftSpace = Math.min(
    ...clearedSpaceLines.map((line) => {
      if (line.length === 0) {
        return Infinity;
      }

      const result = /^ +/.exec(line);
      return result ? result[0].length : 0;
    }),
  );

  const removeLeftSpace = clearedSpaceLines.map((line) =>
    line.substring(blockLeftSpace, line.length),
  );

  return removeLeftSpace.join('\n');
}

/** 获取高亮代码行数据 */
export function getHighlightCode(code: string) {
  const hlLabel = /\/\*\*\* +hl +\*\*\*\//g;
  const highlightLines: Record<number, boolean> = {};
  const lines = formatCode(code)
    .split(/[\n\r]/)
    .map((line, index) => {
      const match = line.match(hlLabel);

      if (match) {
        line = line.replace(hlLabel, '');
        highlightLines[index] = true;
      }

      return line.trimEnd();
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

/** 空行代码分割线 */
function addSplitLabelInSpace(tabCount: number, tabWidth: number, label = splitTag) {
  const space = Array(tabWidth).fill(' ').join('');
  return Array(tabCount).fill(`${label}${space}`).join('').trim();
}

/** 计算此行分割线数量 */
function getTabCount(code: string, tabWidth: number) {
  const space = /^ */.exec(code);

  if (space) {
    return Math.ceil(space[0].length / tabWidth);
  } else {
    return 0;
  }
}

function addSplitLabelInCode(code: string, tabWidth: number, label = splitTag) {
  const space = /^ */.exec(code);

  if (!space) {
    return code;
  }

  const chars = code.split('');

  let index = 0;
  let spaceIndex = 0;

  while (chars[index] === ' ') {
    if (index === 0 || spaceIndex === tabWidth) {
      chars.splice(index, 0, label);
      index++;
      spaceIndex = 1;
    } else {
      spaceIndex++;
    }

    index++;
  }

  return chars.join('');
}

/** 代码添加分割线 */
export function addSplitLabel(code: string | string[], tabWidth: number, label = splitTag) {
  let currentTab = 0;

  const lines = Array.isArray(code) ? code : code.split('\n');
  const labeled = lines.map((line) => {
    const isSpace = line.trim().length === 0;

    if (isSpace) {
      return addSplitLabelInSpace(currentTab, tabWidth, label);
    } else {
      currentTab = getTabCount(line, tabWidth);
      return addSplitLabelInCode(line, tabWidth, label);
    }
  });

  return labeled;
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
