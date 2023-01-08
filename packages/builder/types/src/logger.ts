import { info } from 'console';

/** 日志等级字符串 */
export type LogLevel = keyof typeof LogLevelEnum;

/** 日志等级 */
export enum LogLevelEnum {
  Debug,
  Info,
  Error,
  Silence,
}

export interface LoggerInstance {
  log(): void;
  info(): void;
  error(): void;
}
