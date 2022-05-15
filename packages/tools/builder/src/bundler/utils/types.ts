export type FileContent = Buffer | undefined;

export interface FileCache {
  readFile(target: string): FileContent | Promise<FileContent>;
  writeFile(target: string, content: Buffer): void;
}
