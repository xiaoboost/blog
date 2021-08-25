import React from 'react';
import styles from './index.jss';
import highlight from 'highlight.js';

import { AssetData } from '@blog/utils';
import { stringifyClass } from '@xiao-ai/utils';
import { getHighlightCode, getMinSpaceWidth, getLineSpaceWidth, addSplitLabel } from './utils';

export const assets: AssetData[] = require("./index.script").default;
export const ModuleName = process.env.ModuleName as string;
export * from './utils';

export interface WrapperProps {
  /** 代码语言 */
  lang?: string;
  /** 代码共几行 */
  lineCount: number;
  /** 高亮的行数 */
  highlightLines: Record<number, boolean>;
}

export function CodeBlockWrapper(props: React.PropsWithChildren<WrapperProps>) {
  const { classes } = styles;
  const { lang, lineCount, highlightLines, children } = props;

  return (
    <pre className={classes.codeBlockWrapper}>
      {lang ? <label className={classes.codeBlockLabel}>{lang}</label> : ''}
      <code className={classes.codeBlockList}>
        <ul className={classes.codeBlockGutter}>
          {Array(lineCount).fill(0).map((_, i) => (
            <li className={highlightLines[i] ? classes.codeBlockHighlightLine : ''}>{i + 1}</li>
          ))}
        </ul>
        <span className={classes.codeBlockBox}>
          {children}
        </span>
      </code>
    </pre>
  );
}

export interface CodeBlockProps {
  lang?: string;
}

function renderCode(code: string, language: string, tabWidth: number) {
  const rendered = highlight.highlight(code, { language });
  const lines = rendered.value.trim().split('\n');
  return lines.map((line) => {
    return getLineSpaceWidth(line) > 0 ? addSplitLabel(line, tabWidth) : line;
  });
}

export function CodeBlock({ lang, children }: React.PropsWithChildren<CodeBlockProps>) {
  if (typeof children !== 'string') {
    throw new Error('代码块的子元素必须是字符串');
  }

  const { classes } = styles;
  const lan = lang ? lang.toLowerCase() : '';
  const tabWidth = getMinSpaceWidth(children);
  const { code, highlightLines } = getHighlightCode(children);
  const codeLines = renderCode(code, lan, tabWidth);

  return (
    <CodeBlockWrapper lang={lang} lineCount={codeLines.length} highlightLines={highlightLines}>
      <ul className={classes.codeBlockBox}>
        {codeLines.map((line, i) => (
          <li className={stringifyClass({
            [classes.codeBlockHighlightLine]: highlightLines[i],
          })}>
            <span dangerouslySetInnerHTML={{ __html: line }} />
          </li>
        ))}
      </ul>
    </CodeBlockWrapper>
  );
}
