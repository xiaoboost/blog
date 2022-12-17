import type { BuildIncremental, Loader as esBuildLoader } from 'esbuild';
import type { BuilderHooks, BundlerHooks } from './hooks';
import type { ErrorData } from './error';
import type { AssetData } from './asset';

/** 构建器选项 */
export type BuilderOptions = ExtendOptions & CommandOptions;

/**
 * 加载器
 *   - `'path'`加载器，获得文件原始路径，并且此文件并不会被打包
 */
export type Loader = esBuildLoader | 'path';

/** 扩展配置 */
export interface ExtendOptions {
  /** 构建器名称 */
  name?: string;
  /** 根路径 */
  root?: string;
  /** 写入硬盘 */
  write?: boolean;
  /** 资源公共路径 */
  publicPath?: string;
  /** 资源命名 */
  assetNames?: string;
  /** 变量定义 */
  defined?: Record<string, string>;
  /** 加载器配置 */
  loader?: Record<string, Loader>;
}

/** 命令行选项 */
export interface CommandOptions {
  /** 输出目录 */
  outDir?: string;
  /** 构建模式 */
  mode?: string;
  /** 是否启用 HMR */
  hmr?: boolean;
  /** 监听模式 */
  watch?: boolean;
  /** 命令行输出带颜色 */
  terminalColor?: boolean;
}

/** 构建器实例 */
export interface BuilderInstance {
  /** 构建器名称 */
  name: string;
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
  /** 停止监听 */
  stop(): Promise<void>;
  /** 是否是子构建器 */
  isChild(): boolean;
  /** 创建子构建器 */
  createChild(opt?: BuilderOptions): Promise<BuilderInstance>;
  /** 添加监听文件 */
  addWatchFiles(...files: string[]): void;
  /** 是否是监听文件 */
  isWatchFiles(...files: string[]): boolean;
  /** 获取错误数据 */
  getErrors(): ErrorData[];
  /** 获取产物文数据 */
  getAssets(): AssetData[];
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
