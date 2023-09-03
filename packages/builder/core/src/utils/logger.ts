import { LogLevel, LogLevelEnum, LoggerInstance } from '@blog/types';
import type { Chalk } from 'chalk';

import Moment from 'moment';

export class Logger implements LoggerInstance {
  private prefix: () => string;

  private printer?: Chalk;

  private level: LogLevel;

  constructor(level: LogLevel = 'Info', printer?: Chalk, prefix?: string) {
    this.level = level;
    this.printer = printer;
    this.prefix = printer
      ? () => printer.green(`[${Moment().format('HH:mm:ss')}]${prefix ? ` ${prefix}` : ''}`)
      : () => `[${Moment().format('HH:mm:ss')}]${prefix ? ` ${prefix}` : ''}`;
  }

  private output(level: LogLevelEnum, ...message: string[]) {
    if (level < LogLevelEnum[this.level]) {
      return;
    }

    console.log(this.prefix(), ...message);
  }

  private log = this.info;

  info(...msg: string[]) {
    this.output(LogLevelEnum.Info, ...msg);
  }

  error(...msg: string[]) {
    this.output(LogLevelEnum.Error, ...msg);
  }

  debug(...msg: string[]) {
    this.output(LogLevelEnum.Debug, ...msg);
  }
}
