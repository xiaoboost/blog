import type { ErrorData } from '@blog/types';
import { isObject } from '@xiao-ai/utils';
import { RunError } from '@xiao-ai/utils/node';

export function isRunError(data: unknown): data is RunError {
  return true;
}

export function isErrorData(data: unknown): data is ErrorData {
  return isObject(data) && 'codeFrame' in data && 'message' in data && 'name' in data;
}
