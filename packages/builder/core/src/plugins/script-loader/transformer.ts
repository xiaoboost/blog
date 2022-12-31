import type { BuilderPlugin } from '@blog/types';
import { readFile } from 'fs/promises';
import { dirname } from 'path';
import * as ts from 'typescript';

const pluginName = 'script-transformer';

export interface TransformerOptions {
  minify?: boolean;
}

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

  (sourceFile as any).statements = sourceFile.statements.filter((node: ts.Statement) => {
    return !ts.isExportAssignment(node) || (node.expression as any).text.trim() !== 'assets';
  });
}

function replaceText(content: string, range: [number, number], newText = '') {
  const leftText = content.substring(0, range[0]);
  const rightText = content.substring(range[1], content.length);
  return `${leftText}${newText}${rightText}`;
}

export const Transformer = ({ minify = false }: TransformerOptions = {}): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.initialization.tap(pluginName, (options) => ({
        ...options,
        format: 'iife',
        platform: 'browser',
        charset: 'utf8',
        minify,
      }));

      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.path !== builder.options.entry) {
          return;
        }

        const content = await readFile(args.path, 'utf-8');
        const sourceFile = ts.createSourceFile(
          'test.ts',
          content,
          ts.ScriptTarget.Latest,
          undefined,
          ts.ScriptKind.TSX,
        );
        const replaceRange = findExportDefault(sourceFile);
        const newContent = replaceRange ? replaceText(content, replaceRange) : content;

        return {
          contents: newContent,
          loader: 'ts',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
