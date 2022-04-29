declare interface AssetData {
  path: string;
  getContent(): Promise<Buffer>;
}
