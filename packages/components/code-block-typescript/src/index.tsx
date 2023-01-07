import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';
import { defineUtils } from '@blog/context/runtime';
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

  const { classes } = styles;
  const { code, highlightLines } = getHighlightCode(children);
  const tabWidth = getMinSpaceWidth(code);
  const codeLines = renderTsCode(code, tabWidth, lang, platform);

  return (
    <CodeBlockWrapper
      lang={lang}
      listClassName={classes.codeBlockLs}
      lineCount={codeLines.length}
      highlightLines={highlightLines}
    >
      {codeLines.map((line, i) => (
        <li
          key={i}
          className={stringifyClass({
            [normalStyles.classes.codeBlockHighlightLine]: highlightLines[i],
          })}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ))}
    </CodeBlockWrapper>
  );
}
