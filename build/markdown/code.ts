import { highlight, highlightAuto } from 'highlight.js';
import { renderTsCode, Platform, ScriptKind } from './typescript';
import { stringifyClass } from '@build/utils';

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

/** 代码有多少前置空格 */
function getLineSpaceWidth(str: string) {
  const result = /^ +/.exec(str);
  return result ? result[0].length : 0;
}

/** 代码添加分割线 */
function addSplitLabel(line: string, tabWidth: number) {
  const splitCode = '<span class="code-block__split"></span>';

  let code = line;
  let index = 0;
  let realIndex = 0;

  if (line.trim().length === 0) {
    return splitCode;
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

    code = before + splitCode + after;

    index++;
    realIndex = realIndex + splitCode.length + 1;
  }

  return code
}

/** 获取当前代码 tab 宽度 */
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

/** 获取高亮代码行记录 */
function getHighlightCode(code: string) {
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

  if (val === 'ts' || val === 'typescript') {
    return 'ts';
  }
  else if (val === 'tsx') {
    return 'tsx';
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
  /** 空格宽度 */
  const tabWidth = getMinSpaceWidth(input);
  /** 代码与高亮行 */
  const { code, highlightLines } = getHighlightCode(input);
  /** 行代码 */
  const codeLines = scriptKind
    ? renderTsCode(code, scriptKind, attrs.platform as Platform)
    : (
      lan
        ? highlight(code, { language: lan })
        : highlightAuto(code)
    ).value.trim().split('\n');

  /** 按照行编译代码 */
  const content = codeLines.map((line, index) => {
    const hasLeftSpace = getLineSpaceWidth(line) > 0;
    const className = highlightLines[index] ? ` class="code-block__highlight-line"` : '';
    const lineCode = hasLeftSpace
      ? `<li${className}>${addSplitLabel(line, tabWidth)}</li>`
      : `<li${className}>${line}</li>`;

    return lineCode;
  });
  /** 代码行号 */
  const list = new Array(codeLines.length).fill(0).map((_, i) => (
    highlightLines[i]
      ? `<li class="code-block__highlight-line">${i + 1}</li>`
      : `<li>${i + 1}</li>`
  ));
  /** 代码 class 名称 */
  const codeClassName = stringifyClass('code-block__code', {
    'code-block__lsp': Boolean(scriptKind),
  });

  return (
    `<pre class="code-block code-block__lang-${lan}">` +
      (label ? `<label class="code-block__label">${label}</label>` : '') +
      '<code class="code-block__list">' +
      `<ul class="code-block__gutter">${list.join('')}</ul>` +
      '<span class="code-block__wrapper">' +
        `<ul class="${codeClassName}">${content.join('')}</ul>` +
      '</span>' +
      '</code>' +
    '</pre>'
  );
}
