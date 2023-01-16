import type { ErrorData, ErrorParam } from '@blog/types';
import type { Message as EsbuildError } from 'esbuild';
import { isObject } from '@xiao-ai/utils';
import { RunError } from '@xiao-ai/utils/node';
import { readFileSync } from 'fs';
import { platform } from 'os';
import { BuilderError } from './error';

function isRunError(data: unknown): data is RunError {
  return isObject(data) && 'location' in data && data.prototype.constructor.name === 'RunError';
}

function isErrorData(data: unknown): data is ErrorData {
  return (
    isObject(data) &&
    ('codeFrame' in data || 'project' in data) &&
    'message' in data &&
    'name' in data
  );
}

function isNormalError(data: unknown): data is Error {
  return isObject(data) && 'message' in data && 'stack' in data;
}

function isEsbuildError(err: any): err is EsbuildError {
  return 'pluginName' in err && 'text' in err && 'location' in err;
}

function transformFile(file?: string) {
  if (!file) {
    return;
  }

  const prefixMatcher = /^[^:]+:/;
  const prefix = prefixMatcher.exec(file);

  if (!prefix) {
    return file;
  }

  if (platform() === 'win32' && /^[A-Z]:/.test(prefix[0].toUpperCase())) {
    return file;
  }

  return file.replace(prefixMatcher, '');
}

function transformEsbuildError(err: any, opt?: ErrorParam): BuilderError | void {
  if (isEsbuildError(err)) {
    if (err.detail) {
      return transform(err.detail, opt);
    } else {
      const { text: message, location } = err;
      const filePath = location?.file ? transformFile(location.file)! : undefined;
      const codeFrame = filePath
        ? {
            content: readFileSync(filePath).toString('utf-8'),
            range: {
              start: {
                line: location!.line,
                column: location!.column + 1,
              },
              end: {
                line: location!.line,
                column: location!.column + location!.length + 1,
              },
            },
          }
        : undefined;

      return new BuilderError({
        project: opt?.project ?? 'UNKNOWN_PROJECT',
        message,
        name: 'ESBUILD',
        filePath,
        codeFrame,
      });
    }
  }
}

function transformNormalError(err: any, opt?: ErrorParam): BuilderError | void {
  if (isNormalError(err)) {
    return new BuilderError({
      project: opt?.project ?? 'UNKNOWN_PROJECT',
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
  }
}

function transformRunError(err: any, opt?: ErrorParam): BuilderError | void {
  if (isRunError(err)) {
    return new BuilderError({
      ...opt,
      name: err.name,
      message: err.message,
      project: opt?.project ?? 'UNKNOWN_PROJECT',
    });
  }
}

function transformErrorData(err: any, opt?: ErrorParam): BuilderError | void {
  if (isErrorData(err)) {
    return new BuilderError({
      ...opt,
      project: opt?.project ?? err.project ?? 'UNKNOWN_PROJECT',
      name: err.name ?? err.name ?? 'UNKNOWN_ERROR',
      message: err.message,
      codeFrame: err.codeFrame,
    });
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

const transformers = [
  transformEsbuildError,
  transformRunError,
  transformNormalError,
  transformErrorData,
];

export function transform(err: any, opt?: ErrorParam) {
  for (const fn of transformers) {
    const result = fn(err, opt);

    if (result) {
      return result;
    }
  }

  return defaultError(err, opt);
}
