import React from 'react';
import highlight from 'highlight.js';
import { stringifyClass } from '@xiao-ai/utils';
import { defineUtils, getReference } from '@blog/context/runtime';

import styles from './index.jss';
import script from './code-block.script';

import { getHighlightCode, getMinSpaceWidth, addSplitLabel, getLangLabel } from './utils';

export * from './utils';
export { styles };

export const utils = defineUtils(script);

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
  return addSplitLabel(rendered.value.trim(), tabWidth);
}

export function CodeBlock({ lang, children }: React.PropsWithChildren<CodeBlockProps>) {
  if (typeof children !== 'string') {
    throw new Error('代码块的子元素必须是字符串');
  }

  interface CodeBlockData {
    lines: string[];
    highlight: Record<number, boolean>;
  }

  const { classes } = styles;
  const lan = lang ? lang.toLowerCase() : '';
  const cache = getReference<Map<string, CodeBlockData>>('code-block-normal', new Map());
  const { lines, highlight } = (() => {
    const key = `${lan}:${children}`;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const tabWidth = getMinSpaceWidth(children);
    const { code, highlightLines } = getHighlightCode(children);
    const result = {
      lines: renderCode(code, lan, tabWidth),
      highlight: highlightLines,
    };

    cache.set(key, result);

    return result;
  })();

  return (
    <CodeBlockWrapper lang={lang} lineCount={lines.length} highlightLines={highlight}>
      {lines.map((line, i) => (
        <li
          key={i}
          className={stringifyClass({
            [classes.codeBlockHighlightLine]: highlight[i],
          })}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ))}
    </CodeBlockWrapper>
  );
}
