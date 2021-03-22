import { highlight, highlightAuto } from 'highlight.js';
import { renderTsCode, Platform, ScriptKind } from './typescript';

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
  'c艹': 'C++',
  python: 'Python',
  bash: 'Bash',
  haskell: 'Haskell',
  json: 'JSON',
};

function getLineSpaceWidth(str: string) {
  const result = /^ +/.exec(str);
  return result ? result[0].length : 0;
}

function getMinSpaceWidth(str: string) {
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

function getHighlightCode(code: string) {
  const hlLabel = /\/\*\*\* +hl +\*\*\*\//g;
  const highlightLine: Record<number, boolean> = {};
  const lines = code.trim().split(/[\n\r]/).map((line, index) => {
    const match = line.match(hlLabel);

    if (match) {
      line = line.replace(hlLabel, '');
      highlightLine[index] = true;
    }

    return line.trimRight();
  });

  return {
    code: lines.join('\n'),
    lines: highlightLine,
  };
}

function splitLabel(number: number, width: number, rightSpace = true) {
  const space = ' '.repeat(width);
  const label = `<span class="code-block__split"></span>${space}`.repeat(number);
  return rightSpace ? label : label.trim();
}

function parseAttr(input: string) {
  const attrs: Record<string, string | boolean> = {};

  for (const str of input.split(/[ ,]+/)) {
    const [key, val] = str.split('=');
    attrs[key] = val ?? true;
  }

  return attrs;
}

function toScriptKind(input: string): ScriptKind | false {
  const val = input.toLowerCase();

  if (['ts', 'js', 'tsx', 'jsx'].includes(input)) {
    return input as ScriptKind;
  }
  else if (val === 'javascript') {
    return 'js';
  }
  else if (val === 'typescript') {
    return 'ts';
  }
  else {
    return false;
  }
}

export function CodeRenderer(input: string, lang: string, attribute = '') {
  /** 代码语言 */
  const lan = lang ? lang.toLowerCase() : '';
  /** 代码语言标记 */
  const label = langLabel[lan];
  /** 代码框属性 */
  const attrs = parseAttr(attribute);
  /** 是否是脚本语言 */
  const scriptKind = toScriptKind(lang);

  debugger;
  // ts 语言另外做处理
  if (scriptKind) {
    renderTsCode(input, scriptKind, attrs.platform as Platform);
  }

  /** 经处理的代码和高亮行 */
  const { code, lines } = getHighlightCode(input);
  /** 渲染代码 */
  const text = lan ? highlight(lan, code) : highlightAuto(code);
  /** 按行切割代码 */
  const codeLines = text.value.trim().split('\n');
  /** 空格宽度 */
  const splitWidth = getMinSpaceWidth(code);

  let lastSpaceWidth = 0;

  /** 按照行编译代码 */
  const content = codeLines.map((line, index) => {
    // TODO: 还需要修改
    const space = getLineSpaceWidth(line);
    const number = space / splitWidth;
    const spaceWithSplit = splitLabel(number, splitWidth);
    const newLine = line.replace(/^ +/, spaceWithSplit);
    const className = lines[index] ? ` class="code-block__highlight-line"` : '';
    const lineCode = (line === '')
      ? `<li${className}>${splitLabel(lastSpaceWidth, splitWidth, false)}</li>`
      : `<li${className}>${newLine}</li>`;

    if (number > 0) {
      lastSpaceWidth = number;
    }

    return lineCode;
  });
  /** 代码行号 */
  const list = new Array(codeLines.length).fill(0).map((_, i) => {
    return lines[i]
      ? `<li class="code-block__highlight-line">${i + 1}</li>`
      : `<li>${i + 1}</li>`;
  });

  return (
    `<pre class="code-block code-block__lang-${lan}">` +
      (label ? `<label class="code-block__label">${langLabel[lan]}</label>` : '') +
      '<code class="code-block__list">' +
      `<ul class="code-block__gutter">${list.join('')}</ul>` +
      '<span class="code-block__wrapper">' +
        `<ul class="code-block__code">${content.join('')}</ul>` +
      '</span>' +
      '</code>' +
    '</pre>'
  );
}
