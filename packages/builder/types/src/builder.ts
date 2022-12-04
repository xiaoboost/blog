import type { BuildIncremental, Loader } from 'esbuild';
import type { BuilderHooks, BundlerHooks } from './hooks';

/** 构建器选项 */
export interface BuilderOptions extends Required<CommandOptions> {
  publicPath: string;
  assetNames: string;
  defined: Record<string, string>;
  loader: Record<string, Loader>;
  cacheFilesExts: string[];
}

/** 命令行选项 */
export interface CommandOptions {
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

/** 代码打包结果 */
export interface BundlerResult {
  source: string;
  sourceMap?: string;
}

/** 打包器实例 */
export interface BundlerInstance {
  /** 钩子数据 */
  hooks: BundlerHooks;
  /** 打包代码 */
  bundle(): Promise<BuildIncremental>;
  /** 获取打包后的代码 */
  getBundledCode(): BundlerResult;
}

/** 运行器实例 */
export interface RunnerInstance {
  /** 运行代码 */
  run(source: BundlerResult): Promise<void>;
}
