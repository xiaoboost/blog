export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface CodeFrameData {
  path: string;
  content: string;
  range: Range;
}

export interface ErrorData {
  /** 项目名称 */
  project: string;
  /** 错误名称 */
  name: string;
  /** 错误信息 */
  message: string;
  /** 代码提示 */
  codeFrame?: CodeFrameData;
}

/** 原始错误 */
export interface OriginError {
  /** 原始数据 */
  error: any;
  /** 映射数据 */
  sourceMap?: string;
}
