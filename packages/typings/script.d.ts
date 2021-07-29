declare module '*.script' {
  export interface FileData {
    path: string;
    contents: Buffer;
  }

  const files: FileData[];
  export default files;
}
