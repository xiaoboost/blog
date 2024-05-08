import React from 'react';
import {
  defineUtils,
  getReference,
  RuntimeBuilder as Builder,
  forEach,
} from '@blog/context/runtime';
import {
  styles as normalStyles,
  WrapperProps,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';

import { stringifyClass } from '@xiao-ai/utils';
import { ComponentName } from './constant';
import { getImportedByPost, npmInstall, removeReference } from './utils';
import { name as ComponentPkgName } from '../package.json';

import styles from './index.jss';
import assets from './code-block-ts.script';
import { renderTsCode, ScriptKind, Platform, RenderedTsCodeLine } from './typescript';

export { ScriptKind, Platform } from './typescript';
export const utils = defineUtils(assets);

const { path: cacheTsServerDir } = Builder.getCacheAccessor(ComponentName);

export interface Options {
  children?: string;
  lang?: ScriptKind;
  platform?: Platform;
  showError?: boolean;
}

export function TsCodeBlock({
  lang = 'ts',
  platform = 'none',
  showError = true,
  children = '',
}: React.PropsWithChildren<Options> = {}) {
  if (typeof children !== 'string') {
    throw new Error('代码块的子元素必须是字符串');
  }

  interface CodeBlockData {
    lines: RenderedTsCodeLine[];
    highlight: Record<number, boolean>;
  }

  const { classes } = styles;
  const cache = getReference<Map<string, CodeBlockData>>(`${ComponentName}-ts-code`, new Map());
  const { lines, highlight, customLines } = (() => {
    const key = `typescript:${children}`;

    if (!cache.has(key)) {
      const removedExtractCode = removeReference(children);
      const { code, highlightLines } = getHighlightCode(removedExtractCode);
      const tabWidth = getMinSpaceWidth(code);
      const result = {
        lines: renderTsCode(code, tabWidth, cacheTsServerDir, lang, platform, showError),
        highlight: highlightLines,
      };
      cache.set(key, result);
    }

    const result = cache.get(key)!;
    const customLines: NonNullable<WrapperProps['customLines']> = {};

    Builder.logger.debug(`${TsCodeBlock}: use cache`);

    result.lines.forEach((line, index) => {
      if (line.noIndex || line.indexClassNames) {
        customLines[index + 1] = {
          noIndex: line.noIndex,
          classNames: line.indexClassNames,
        };
      }
    });

    return {
      ...result,
      customLines,
    };
  })();

  return (
    <CodeBlockWrapper
      lang={lang}
      wrapperClassName={classes.codeBlockLs}
      lineCount={lines.length}
      highlightLines={highlight}
      customLines={customLines}
    >
      {lines.map((line, i) =>
        React.createElement('li', {
          key: i,
          dangerouslySetInnerHTML: {
            __html: line.code,
          },
          className: stringifyClass(...(line.classNames ?? []), {
            [normalStyles.classes.codeBlockHighlightLine]: highlight[i + 1],
          }),
          ...line.attributes,
        }),
      )}
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
