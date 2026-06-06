/** 全局资源规则 */
export interface GlobalAssetRule {
  /** 文件匹配 */
  test: RegExp;
}

/** 全局资源规则输入 */
export type GlobalAssetOption = GlobalAssetRule | GlobalAssetRule[];
