/** 访问器 */
export interface Accessor<T> {
  /** 获取值 */
  get(): T;
  /** 储存值 */
  set(val: T): void;
}

/** 文件访问器 */
export interface AccessorGetter<T> {
  /** 获取资源本身 */
  get(): T;
}
