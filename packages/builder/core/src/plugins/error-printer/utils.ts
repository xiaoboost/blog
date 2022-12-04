import type { ErrorData } from '@blog/types';
import { isObject } from '@xiao-ai/utils';
import { Instance } from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';

const print = new Instance({ level: 3 });

export function toString(data: ErrorData) {
  const { name, message: msg, codeFrame } = data;

  let message = '';

  message += `${print.red(`\n[${name}]`)} ${msg}\n\n`;
  message += `${print.bgRed('File:')} ${codeFrame.path}:${codeFrame.range.start.line}\n`;
  message += codeFrameColumns(codeFrame.content, codeFrame.range, {
    highlightCode: true,
  });

  return message;
}

export function isErrorData(data: unknown): data is ErrorData {
  return isObject(data) && 'codeFrame' in data && 'message' in data && 'name' in data;
}
