import type { BuilderPlugin } from '@blog/types';
import { readFile } from 'fs/promises';
import { dirname } from 'path';

import * as ts from 'typescript';

import { EntrySuffix } from '../utils';

const pluginName = 'script-transformer';

function findExportDefault(sourceFile: ts.SourceFile) {
  const range = [0, 0] as [number, number];

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportAssignment(statement) &&
      statement.expression.getFullText(sourceFile).trim() === 'assets'
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

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (!EntrySuffix.test(args.path)) {
          return;
        }

        const content = await readFile(args.path, 'utf-8');
        const newContent = replaceByText(content) ?? replaceByAST(content);

        return {
          contents: newContent,
          loader: 'ts',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
