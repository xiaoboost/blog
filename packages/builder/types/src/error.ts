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
  message: string;
  name: string;
  codeFrame: CodeFrameData;
}
