import { isString } from '@xiao-ai/utils';
import { LogLevel, LogLevelEnum } from '@blog/types';

export class Logger {
  private prefix: () => string;

  private level: LogLevel;

  constructor(prefix: string | (() => string), level: LogLevel = 'Info') {
    this.prefix = isString(prefix) ? () => prefix : prefix;
    this.level = level;
  }

  private output(level: LogLevelEnum, ...message: string[]) {
    if (level < LogLevelEnum[this.level]) {
      return;
    }

    console.log(this.prefix(), ...message);
  }

  log = this.info;

  info(...msg: string[]) {
    this.output(LogLevelEnum.Info, ...msg);
  }

  error(...msg: string[]) {
    this.output(LogLevelEnum.Error, ...msg);
  }

  debug(...info: string[]) {
    this.output(LogLevelEnum.Debug, ...info);
  }
}
