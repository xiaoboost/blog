import type { BuildIncremental } from 'esbuild';
import type { BuilderHooks, BundlerHooks, RunnerHooks } from './hooks';

/** 构建器选项 */
export interface BuilderOptions {
  outDir?: string;
  mode?: string;
  hmr?: boolean;
  isWatch?: boolean;
}

/** 构建器实例 */
export interface BuilderInstance {
  /** 根路径 */
  root: string;
  /** 钩子数据 */
  hooks: BuilderHooks;
  /** 构建选项 */
  options: Required<BuilderOptions>;
  /** 初始化 */
  init(): Promise<void>;
  /** 构建 */
  build(): Promise<void>;
  /** 监听 */
  watch(): Promise<void>;
  /** 停止监听 */
  stop(): Promise<void>;
}

/** 打包器实例 */
export interface BundlerInstance {
  /** 钩子数据 */
  hooks: BundlerHooks;
  /** 打包代码 */
  bundle(): Promise<BuildIncremental>;
  /** 获取打包后的代码 */
  getBundledCode(): string;
}

/** 运行器实例 */
export interface RunnerInstance {
  /** 钩子数据 */
  hooks: RunnerHooks;
  /** 运行代码 */
  run(code: string): Promise<void>;
}
