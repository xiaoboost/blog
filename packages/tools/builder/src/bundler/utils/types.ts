export type FileContent = Buffer | undefined;

export interface FileCache {
  readFile(target: string): FileContent | Promise<FileContent>;
  writeFile(target: string, content: Buffer): void;
}

export interface Position {
  line: number;
  column?: number;
}

export interface BuildError {
  message: string;
  file: string;
  content: string;
  label?: string;
  position: {
    start: Position;
    end?: Position;
  };
}
