import type { PreloadAssetData, ScriptAssetData, StyleAssetData } from './asset';
import type { RuntimeHooks } from './hooks';

/** 运行时数据 */
export interface RuntimeData {
  hooks: RuntimeHooks;
}

/** 构建钩子回调 */
export type BuildHook = (runtime: RuntimeData) => void;

/** 初始化钩子回调 */
export type InitHook = BuildHook;

/** 模板脚本引用；position 只用于选择标签位置，不属于标签属性。 */
export interface TemplateScriptAsset extends ScriptAssetData {
  position?: 'head' | 'body';
}

/** 模板资源引用，不包含文件内容；字符串按后缀识别为普通脚本、样式或其他资源。 */
export type TemplateAsset = string | PreloadAssetData | StyleAssetData | TemplateScriptAsset;

/** 模板辅助函数 */
export interface TemplateUtils {
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
  /** 获取预加载资源 */
  getPreloadAssets(): PreloadAssetData[];
}
