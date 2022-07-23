/** 静态资源引用数据 */
declare interface AssetImportData {
  path: string;
  getContent: () => Buffer | Promise<Buffer>;
}

/** 静态资源数据 */
declare interface AssetData {
  path: string;
  content: Buffer;
}

/** 创建静态资源 */
declare type CreateAssets = () => Promise<AssetData[]>;

/** 获取静态资源路径 */
declare type GetAssetNames = () => string[];
