/** 访问器 */
export interface Accessor<T> {
  /** 获取值 */
  get(): T;
  /** 储存值 */
  set(val: T): T;
}

/** 文件访问器 */
export interface AccessorGetter<T> {
  /** 获取资源本身 */
  get(): T;
}

/** 缓存访问器 */
export interface CacheAccessor {
  /** 缓存的真实路径 */
  path: string;
  /** 读取缓存 */
  read(path: string | number): Promise<Buffer | undefined>;
  /** 写入缓存 */
  write(path: string | number, content: Buffer | string): Promise<void>;
}
