import highlight from 'highlight.js';

import { stringifyClass } from '@xiao-ai/utils';
import { renderTsCode, Platform, ScriptKind } from './typescript';
import { highlightLineClassName, lspClassName } from './constant';

import {
  createNumberList,
  getLineSpaceWidth,
  getMinSpaceWidth,
  addSplitLabel,
  getHighlightCode,
} from './utils';

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

function renderCode(code: string, language: string, tabWidth: number) {
  const rendered = highlight.highlight(code, { language });
  const lines = rendered.value.trim().split('\n');
  return lines.map((line) => {
    return getLineSpaceWidth(line) > 0 ? addSplitLabel(line, tabWidth) : line;
  });
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
    ? renderTsCode(code, tabWidth, scriptKind, attrs.platform as Platform)
    : renderCode(code, lan, tabWidth);
  /** 渲染后的行代码 */
  const codeLineRendered = codeLines.map((line, i) => {
    const className = highlightLines[i] ? ` class="${highlightLineClassName}"` : '';
    return `<li${className}>${line}</li>`;
  });
  /** 代码行号 */
  const list = createNumberList(codeLineRendered.length, highlightLines);
  /** 代码 class 名称 */
  const codeClassName = stringifyClass('code-block__code', {
    [lspClassName]: Boolean(scriptKind),
  });

  return (
    `<pre class="code-block code-block__lang-${lan}">` +
      (label ? `<label class="code-block__label">${label}</label>` : '') +
      '<code class="code-block__list">' +
      `<ul class="code-block__gutter">${list.join('')}</ul>` +
      '<span class="code-block__wrapper">' +
        `<ul class="${codeClassName}">${codeLineRendered.join('')}</ul>` +
      '</span>' +
      '</code>' +
    '</pre>'
  );
}
