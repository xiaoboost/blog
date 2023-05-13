import type { CodeFrameData, ErrorData, ErrorParam } from '@blog/types';
import { default as chalk, Chalk } from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';
import { transform } from './transform';

export class BuilderError extends Error implements ErrorData {
  static from(err: any, opt?: ErrorParam) {
    if (err instanceof BuilderError) {
      if (opt?.project) {
        err.project = opt.project;
      }

      return err;
    }

    return transform(err, opt);
  }

  project: string;

  filePath?: string;

  codeFrame?: CodeFrameData | undefined;

  constructor(opt: ErrorData) {
    super(opt.message);
    this.name = opt.name;
    this.stack = opt.stack;
    this.project = opt.project;
    this.filePath = opt.filePath;
    this.codeFrame = opt.codeFrame;
  }

  toString(printer: Chalk = chalk) {
    const { project, name, message: msg, filePath, codeFrame } = this;

    let message = '';

    message += `${printer.red(`[${project}]`)} ${printer.blue(name)}: ${msg}`;

    if (filePath) {
      message += `\n${printer.bgRed('File:')} ${filePath}`;

      if (codeFrame) {
        message += `:${codeFrame.range.start.line}`;
      }
    }

    if (codeFrame) {
      message += `\n${codeFrameColumns(codeFrame.content, codeFrame.range, {
        highlightCode: true,
      })}`;
    } else if (this.stack) {
      message += `\n${this.stack}`;
    }

    return message;
  }
}
