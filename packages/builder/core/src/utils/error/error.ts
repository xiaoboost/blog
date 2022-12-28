import type { CodeFrameData, ErrorData, ErrorParam } from '@blog/types';
import { default as chalk, Chalk } from 'chalk';
import { codeFrameColumns } from '@babel/code-frame';
import { transform } from './transform';

export class BuilderError extends Error implements ErrorData {
  static from(err: any, opt?: ErrorParam) {
    if (err instanceof BuilderError) {
      return err;
    }

    return transform(err, opt);
  }

  project: string;

  codeFrame?: CodeFrameData | undefined;

  constructor(opt: ErrorData) {
    super(opt.message);
    this.name = opt.name;
    this.project = opt.project;
  }

  toString(printer: Chalk = chalk) {
    const { project, name, message: msg, codeFrame } = this;

    let message = '';

    message += `${printer.red(`\n[${project}]`)} ${printer.blue(name)}: ${msg}\n\n`;

    if (codeFrame) {
      message += `${printer.bgRed('File:')} ${codeFrame.path}:${codeFrame.range.start.line}\n`;
      message += codeFrameColumns(codeFrame.content, codeFrame.range, {
        highlightCode: true,
      });
    }

    return message;
  }
}