import type { BuilderPlugin } from '@blog/types';

import * as ts from 'typescript';

import { EntrySuffix } from '../utils';

const pluginName = 'script-transformer';

function findExportDefault(sourceFile: ts.SourceFile) {
  const range = [0, 0] as [number, number];

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportAssignment(statement)
      && statement.expression.getFullText(sourceFile).trim() === 'assets'
    ) {
      range[0] = statement.getStart(sourceFile);
      range[1] = statement.getEnd();
      return range;
    }
  }
}

function replaceByText(content: string) {
  const matcher = /export +default +assets;/;
  const result = content.match(matcher);

  if (!result) {
    return;
  }

  const oldText = result[0];
  return content.replace(oldText, ' '.repeat(oldText.length));
}

function replaceByAST(content: string) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    content,
    ts.ScriptTarget.Latest,
    undefined,
    ts.ScriptKind.TSX,
  );
  const replaceRange = findExportDefault(sourceFile);

  if (!replaceRange) {
    return content;
  }

  const oldSegment = content.substring(...replaceRange);
  const newSegment = oldSegment.replace(/[^\n]/g, ' ');
  const newContent = content.replace(oldSegment, newSegment);

  return newContent;
}

export const Transformer = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const minify = builder.options.mode === 'production';

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.initialization.tap(pluginName, (options) => ({
        ...options,
        format: 'iife',
        platform: 'browser',
        charset: 'utf8',
        minify,
      }));

      bundler.hooks.transform.tap(pluginName, (input, ctx) => {
        if (
          !input.module.sourcePath || !EntrySuffix.test(input.module.sourcePath)
          || (input.format !== 'ts' && input.format !== 'js')
        ) {
          return input;
        }

        const content = input.code;
        const newContent = replaceByText(content) ?? replaceByAST(content);

        // 沿用旧 loader 和替换算法，先保证迁移产物逐字节一致。
        return ctx.update(input, { code: newContent, format: 'ts', map: 'identity' });
      });
    });
  },
});
