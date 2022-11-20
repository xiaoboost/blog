/** 静态资源数据 */
export interface AssetData {
  path: string;
  content: Buffer;
}

/** 访问器 */
export interface Accessor<T> {
  /** 获取值 */
  get(): T | undefined;
  /** 储存值 */
  set(val: T): void;
}

/** 文件访问器 */
export interface FileAccessor {
  /** 获取资源本身 */
  get(): Buffer | undefined;
  /** 获取“获取资源”代码 */
  getCode(): string;
}
