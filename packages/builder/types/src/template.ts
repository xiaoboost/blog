import type { RuntimeHooks } from './hooks';
import type { AssetData } from './asset';

/** 运行时数据 */
export interface RuntimeData {
  hooks: RuntimeHooks;
}

/** 模板辅助函数 */
export interface TemplateUtils {
  createAssets(): AssetData[] | Promise<AssetData[]>;
  getAssetNames(): string[];
}
