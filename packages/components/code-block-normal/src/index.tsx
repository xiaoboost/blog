import React from 'react';
import styles from './index.jss';
import highlight from 'highlight.js';

import { AssetData } from '@blog/utils';
import { stringifyClass } from '@xiao-ai/utils';
import {
  getHighlightCode,
  getMinSpaceWidth,
  getLineSpaceWidth,
  addSplitLabel,
  getLangLabel,
} from './utils';

export const assets: AssetData[] = require('./index.script').default;
export const ModuleName = process.env.ModuleName as string;
export * from './utils';
export { styles };

export interface WrapperProps {
  /** 代码语言 */
  lang?: string;
  /** 代码共几行 */
  lineCount: number;
  /** 高亮的行数 */
  highlightLines: Record<number, boolean>;
  /** 列表的样式名称 */
  listClassName?: string;
}

export function CodeBlockWrapper(props: React.PropsWithChildren<WrapperProps>) {
  const { classes } = styles;
  const { lang, lineCount, highlightLines, children } = props;

  return (
    <pre className={classes.codeBlockWrapper}>
      {lang ? <label className={classes.codeBlockLabel}>{getLangLabel(lang)}</label> : ''}
      <code className={classes.codeBlockList}>
        <ul className={classes.codeBlockGutter}>
          {Array(lineCount)
            .fill(0)
            .map((_, i) => (
              <li
                key={i}
                className={stringifyClass({
                  [classes.codeBlockHighlightLine]: highlightLines[i],
                })}
              >
                {i + 1}
              </li>
            ))}
        </ul>
        <span className={classes.codeBlockBox}>
          <ul className={stringifyClass(classes.codeBlockCode, props.listClassName)}>{children}</ul>
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
      {codeLines.map((line, i) => (
        <li
          key={i}
          className={stringifyClass({
            [classes.codeBlockHighlightLine]: highlightLines[i],
          })}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ))}
    </CodeBlockWrapper>
  );
}
