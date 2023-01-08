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
  log(...messages: string[]): void;
  info(...messages: string[]): void;
  error(...messages: string[]): void;
}
