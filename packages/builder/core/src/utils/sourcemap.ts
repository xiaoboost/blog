import type { CodeFrameData, Range } from '@blog/types';
import { SourceMapConsumer } from 'source-map';
import { lookItUp } from 'look-it-up';
import { isAbsolute } from 'path';
import { readFile } from 'fs/promises';

function getSource(sourceMap: SourceMapConsumer, raw: string, fullPath: string) {
  try {
    const result = sourceMap.sourceContentFor(raw);

    if (result) {
      return result;
    }
  } catch (e) {
    // ..
  }

  return readFile(fullPath, 'utf-8');
}

export async function getOriginCodeFrame(
  position: Range,
  rawSourceMap: string,
): Promise<(CodeFrameData & { path: string }) | undefined> {
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
  const fileContent = filePath && (await getSource(sourceMap, rawFilePath, filePath));

  if (!filePath || !fileContent) {
    return;
  }

  return {
    path: filePath,
    content: fileContent,
    range: {
      start: {
        line: startLoc.line,
        column: (startLoc.column ?? 0) + 1,
      },
      end: {
        line: endLoc.line,
        column: endLoc.column ?? 1,
      },
    },
  };
}
