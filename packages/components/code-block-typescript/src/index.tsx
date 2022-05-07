import React from 'react';
import styles from './index.jss';
import assets = require('./code-block-ts.script');

import { stringifyClass } from '@xiao-ai/utils';
import { renderTsCode, ScriptKind, Platform } from './typescript';
import { getAssetContents, getAssetPaths } from '@blog/shared/node';

import {
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';

export { ready, ScriptKind, Platform } from './typescript';

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

export const createAssets: CreateAssets = () => {
  return getAssetContents(assets);
};

export const getAssetNames: GetAssetNames = () => {
  return getAssetPaths(assets);
};
