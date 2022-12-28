import type { ErrorData, ErrorParam } from '@blog/types';
import type { Message as EsbuildError } from 'esbuild';
import { isObject } from '@xiao-ai/utils';
import { RunError } from '@xiao-ai/utils/node';
import { BuilderError } from './error';

function isRunError(data: unknown): data is RunError {
  return isObject(data) && 'location' in data && data.prototype.constructor.name === 'RunError';
}

function isErrorData(data: unknown): data is ErrorData {
  return isObject(data) && 'codeFrame' in data && 'message' in data && 'name' in data;
}

function isEsbuildError(err: any): err is EsbuildError {
  return 'pluginName' in err && 'text' in err && 'location' in err;
}

function transformEsbuildError(err: any, opt?: ErrorParam): BuilderError | void {
  if (isEsbuildError(err)) {
    // ..
  }
}

function transformNormalError(err: any): BuilderError | void {
  if (err instanceof Error) {
    // const stacks = stackParse(err);
    // return new CodeHelperError(err.name, clearMessage(err.message), {
    //   ...opt,
    //   codeFrame: {
    //     filePath: stacks[0].getFileName(),
    //   },
    //   stack: err.stack && clearStack(err.stack),
    // });
  }
}

function transformRunError(err: any): BuilderError | void {
  if (isRunError(err)) {
    // ..
  }
}

function defaultError(err: any, opt?: ErrorParam) {
  return new BuilderError({
    ...opt,
    project: opt?.project ?? 'UNKNOWN_PROJECT',
    name: err.name ?? 'UNKNOWN_ERROR',
    message: JSON.stringify(err),
  });
}

export function transform(err: any, opt?: ErrorParam) {
  const transformers = [transformEsbuildError, transformRunError, transformNormalError];

  for (const fn of transformers) {
    const result = fn(err, opt);

    if (result) {
      return result;
    }
  }

  return defaultError(err, opt);
}
