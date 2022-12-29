import type { CodeFrameData, Range } from '@blog/types';
import { SourceMapConsumer } from 'source-map';
import { lookItUp } from 'look-it-up';
import { isAbsolute } from 'path';
import { readFile } from 'fs/promises';

export async function getOriginCodeFrame(
  position: Range,
  rawSourceMap: string,
): Promise<CodeFrameData | undefined> {
  debugger;
  const sourceMap = await new SourceMapConsumer(rawSourceMap);
  const startLoc = sourceMap.originalPositionFor({
    line: position.start.line,
    column: position.start.column,
    bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
  });
  const endLoc = sourceMap.originalPositionFor({
    line: position.end.line,
    column: position.end.column,
    bias: SourceMapConsumer.LEAST_UPPER_BOUND,
  });

  if (!startLoc.line || !endLoc.line) {
    return;
  }

  const rawFilePath = startLoc.source ?? endLoc.source;

  if (!rawFilePath) {
    return;
  }

  const filePath = isAbsolute(rawFilePath) ? rawFilePath : await lookItUp(rawFilePath, __dirname);
  const fileContent =
    filePath && sourceMap.sourceContentFor(filePath)
      ? sourceMap.sourceContentFor(filePath)
      : await readFile(filePath!, 'utf-8');

  if (!filePath || !fileContent) {
    return;
  }

  return {
    path: filePath,
    content: fileContent,
    range: {
      start: {
        line: startLoc.line,
        column: startLoc.column ?? 0,
      },
      end: {
        line: endLoc.line,
        column: endLoc.column ?? 0,
      },
    },
  };
}
