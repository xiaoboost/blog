import type { RuntimeHooks } from './hooks';

/** 运行时数据 */
export interface RuntimeData {
  hooks: RuntimeHooks;
}

/** 模板辅助函数 */
export interface TemplateUtils {
  /** 追加到后面 */
  addAssetNames(...assets: string[]): void;
  /** 插入到最前面 */
  insertAssetNames(...assets: string[]): void;
  /** 替换资源 */
  replaceAssetName(oldAsset: string, newAsset: string): void;
  /** 获取所有资源 */
  getAssetNames(): string[];
  /** 获取样式资源 */
  getStyleNames(): string[];
  /** 获取脚本资源 */
  getScriptNames(): string[];
}
