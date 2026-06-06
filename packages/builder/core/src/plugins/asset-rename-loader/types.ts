import type { AssetData } from '@blog/types';

/** 单条重命名规则 */
export interface AssetRenameRule {
  /** 文件匹配 */
  test: RegExp;
  /**
   * 资源名称模板
   * @default '[name].[ext]'
   */
  name?: string;
}

/** 重命名规则输入 */
export type AssetRenameOption = AssetRenameRule | AssetRenameRule[];

/**
 * 重命名方法
 */
export interface Rename {
  (asset: AssetData): string | undefined;
  test(file: string): boolean;
}
