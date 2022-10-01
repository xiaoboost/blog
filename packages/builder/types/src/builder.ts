import type { BuilderHooks, BundlerHooks, RunnerHooks } from './hooks';

/** 构建器选项 */
export interface BuilderOptions {
  outDir?: string;
  mode?: string;
  hmr?: boolean;
}

/** 监听构建实例 */
export interface BuildWatcher {
  stop(): void | Promise<void>;
}

/** 构建器实例 */
export interface BuilderInstance {
  /** 钩子数据 */
  hooks: BuilderHooks;
  /** 构建选项 */
  options: Required<BuilderOptions>;
  /** 初始化 */
  init(): Promise<void>;
  /** 构建 */
  build(): Promise<void>;
  /** 监听 */
  watch(): Promise<BuildWatcher>;
}

/** 打包代码结果 */
export interface BundleResult {
  /** 打包代码 */
  code: string;
  /** 所有文件 */
  files: string;
}

/** 打包器实例 */
export interface BundlerInstance {
  /** 钩子数据 */
  hooks: BundlerHooks;
  /** 打包代码 */
  bundle(): Promise<BundleResult>;
}

/** 运行器实例 */
export interface RunnerInstance {
  hooks: RunnerHooks;
}
