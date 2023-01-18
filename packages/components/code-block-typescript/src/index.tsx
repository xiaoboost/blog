import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';
import { defineUtils, getReference } from '@blog/context/runtime';
import {
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';

import styles from './index.jss';
import assets from './code-block-ts.script';
import { renderTsCode, ScriptKind, Platform } from './typescript';

export { ScriptKind, Platform } from './typescript';
export const utils = defineUtils(assets);

export interface Options {
  children?: string;
  lang?: ScriptKind;
  platform?: Platform;
}

export function TsCodeBlock({
  lang = 'ts',
  platform = 'browser',
  children = '',
}: React.PropsWithChildren<Options> = {}) {
  if (typeof children !== 'string') {
    throw new Error('代码块的子元素必须是字符串');
  }

  interface CodeBlockData {
    lines: string[];
    highlight: Record<number, boolean>;
  }

  const { classes } = styles;
  const cache = getReference<Map<string, CodeBlockData>>('code-block-typescript', new Map());
  const { lines, highlight } = (() => {
    const key = `typescript:${children}`;

    if (cache.has(key)) {
      console.log('use cache');
      return cache.get(key)!;
    }

    const { code, highlightLines } = getHighlightCode(children);
    const tabWidth = getMinSpaceWidth(code);
    const result = {
      lines: renderTsCode(code, tabWidth, lang, platform),
      highlight: highlightLines,
    };

    cache.set(key, result);

    return result;
  })();

  return (
    <CodeBlockWrapper
      lang={lang}
      listClassName={classes.codeBlockLs}
      lineCount={lines.length}
      highlightLines={highlight}
    >
      {lines.map((line, i) => (
        <li
          key={i}
          className={stringifyClass({
            [normalStyles.classes.codeBlockHighlightLine]: highlight[i],
          })}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ))}
    </CodeBlockWrapper>
  );
}
