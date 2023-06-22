import type { AnyObject } from '@xiao-ai/utils';
import type { AssetData } from '@blog/types';

/** 获取文件名 */
export type GetName = (opt: AnyObject) => string;

export interface FileLoaderOption {
  /** 文件匹配 */
  test: RegExp;
  /**
   * 资源名称
   *  - 默认 `'[name].[hash].[ext]'`
   */
  name?: string;
}

export type FileLoaderOptionInput = FileLoaderOption | FileLoaderOption[];

export interface Rename {
  (asset: AssetData): string | undefined;
  test(file: string): boolean;
}
