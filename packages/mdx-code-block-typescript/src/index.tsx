import React from 'react';
import styles from './index.jss';

import { AssetData } from '@blog/utils';
import { stringifyClass } from '@xiao-ai/utils';
import { renderTsCode, ScriptKind, Platform } from './typescript';
import {
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';

export const assets: AssetData[] = require("./index.script").default;
export const ModuleName = process.env.ModuleName as string;

export interface Options {
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
    <CodeBlockWrapper lang={lang} lineCount={codeLines.length} highlightLines={highlightLines}>
      <ul className={classes.codeBlockLsp}>
        {codeLines.map((line, i) => (
          <li className={stringifyClass({
            [normalStyles.classes.codeBlockHighlightLine]: highlightLines[i],
          })}>
            <span dangerouslySetInnerHTML={{ __html: line }} />
          </li>
        ))}
      </ul>
    </CodeBlockWrapper>
  );
}
