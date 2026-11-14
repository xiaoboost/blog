import type {
  LinkAssetData,
  PreloadAssetData,
  ScriptAssetData,
  StyleAssetData,
} from './asset';
import type { BrowserConfig } from './browser-config';

/** 模板脚本引用；position 只用于选择标签位置，不属于标签属性。 */
export interface TemplateScriptAsset extends ScriptAssetData {
  position?: 'head' | 'body';
}

/** 模板资源引用，不包含文件内容；字符串按后缀识别为普通脚本、样式或其他资源。 */
export type TemplateAsset =
  | string
  | LinkAssetData
  | PreloadAssetData
  | StyleAssetData
  | TemplateScriptAsset;

/** 模板辅助函数的配置选项 */
export interface DefineUtilsOptions {
  browserConfig?: BrowserConfig;
}

/** 模板辅助函数 */
export interface TemplateUtils {
  /** 获取当前页面配置 */
  getBrowserConfig(): BrowserConfig;
  /** 添加预加载资源 */
  addPreloadAssets(...assets: PreloadAssetData[]): void;
  /** 追加到后面 */
  addAssetNames(...assets: string[]): void;
  /** 插入到最前面 */
  insertAssetNames(...assets: string[]): void;
  /** 替换资源 */
  replaceAssetName(oldAsset: string, newAsset: string): void;
  /** 获取所有资源 */
  getAssetNames(): string[];
  /** 获取完整资源引用，供合并使用，保留标签配置及脚本位置。 */
  getAssetReferences(): TemplateAsset[];
  /** 获取样式引用及标签配置 */
  getStyles(): StyleAssetData[];
  /** 获取 body 脚本引用及标签配置 */
  getScripts(): ScriptAssetData[];
  /** 获取 head 脚本引用及标签配置 */
  getPreScripts(): ScriptAssetData[];
  /** 获取通用 link 声明 */
  getLinks(): LinkAssetData[];
  /** 获取预加载资源 */
  getPreloadAssets(): PreloadAssetData[];
}
