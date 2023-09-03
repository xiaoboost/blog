import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';
import {
  defineUtils,
  getReference,
  RuntimeBuilder as Builder,
  forEach,
} from '@blog/context/runtime';
import {
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';

import { ComponentName } from './constant';
import { getImportedByPost, npmInstall, removeReference } from './utils';
import { name as ComponentPkgName } from '../package.json';

import styles from './index.jss';
import assets from './code-block-ts.script';
import { renderTsCode, ScriptKind, Platform } from './typescript';

export { ScriptKind, Platform } from './typescript';
export const utils = defineUtils(assets);

const { path: cacheTsServerDir } = Builder.getCacheAccessor(ComponentName);

export interface Options {
  children?: string;
  lang?: ScriptKind;
  platform?: Platform;
}

export function TsCodeBlock({
  lang = 'ts',
  platform = 'none',
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
  const cache = getReference<Map<string, CodeBlockData>>(`${ComponentName}-ts-code`, new Map());
  const { lines, highlight } = (() => {
    const key = `typescript:${children}`;

    if (cache.has(key)) {
      Builder.logger.debug(`${TsCodeBlock}: use cache`);
      return cache.get(key)!;
    }

    const removedExtractCode = removeReference(children);
    const { code, highlightLines } = getHighlightCode(removedExtractCode);
    const tabWidth = getMinSpaceWidth(code);
    const result = {
      lines: renderTsCode(code, tabWidth, cacheTsServerDir, lang, platform),
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

forEach((runtime) => {
  runtime.hooks.beforeEachPost.tapPromise(ComponentName, async (_, index, posts) => {
    // 只运行一次
    if (index !== 0) {
      return;
    }

    const installedPkg = getReference<Set<string>>(`${ComponentName}-installed`, new Set());
    const getAllCodeImport = getImportedByPost(posts);
    const uninstalled = Array.from(getAllCodeImport).filter((key) => !installedPkg.has(key));
    Builder.logger.debug(`${ComponentPkgName}: 开始执行 npm install...`);
    await npmInstall(uninstalled, cacheTsServerDir, (msg: string) => {
      Builder.logger.debug(`${ComponentPkgName}: ${msg}`);
    });
    Builder.logger.debug(`${ComponentPkgName}: npm install 执行完毕`);
    uninstalled.forEach((key) => installedPkg.add(key));
  });
});
