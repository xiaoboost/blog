import type { BuilderHooks, BundlerHooks } from './hooks';
import type { ErrorData } from './error';
import type { AssetData } from './asset';
import type { Resolver } from './resolve';
import type { BuilderPlugin } from './plugin';
import type { LogLevel, LoggerInstance } from './logger';

/** 构建器选项 */
export type BuilderOptions = ExtendOptions & CommandOptions;

/** 模式 */
export type Mode = 'production' | 'development';

/** 扩展配置 */
export interface ExtendOptions {
  /** 构建器名称 */
  name?: string;
  /** 根路径 */
  root?: string;
  /** 入口文件 */
  entry?: string;
  /** 写入硬盘 */
  write?: boolean;
  /** 资源公共路径 */
  publicPath?: string;
  /** 变量定义 */
  defined?: Record<string, string>;
  /** 插件列表 */
  plugins?: BuilderPlugin[];
}

/** 命令行选项 */
export interface CommandOptions {
  /** 输出目录 */
  outDir?: string;
  /** 构建模式 */
  mode?: Mode;
  /** 是否启用 HMR */
  hmr?: boolean;
  /** 监听模式 */
  watch?: boolean;
  /** 命令行输出带颜色 */
  terminalColor?: boolean;
  /** 日志输出等级 */
  logLevel?: LogLevel;
}

/** 构建器实例 */
export interface BuilderInstance {
  /** 构建器名称 */
  readonly name: string;
  /** 根路径 */
  readonly root: string;

  /** 钩子数据 */
  hooks: BuilderHooks;
  /** 构建选项 */
  options: Required<BuilderOptions>;
  /** 获取路径 */
  resolve: Resolver;
  /** 日志打印器 */
  logger: LoggerInstance;

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
  /**
   * 添加资源文件
   *   - 路径重复时，旧资源将会被覆盖
   */
  emitAsset(file: AssetData): void;
  /** 获取错误数据 */
  getErrors(): ErrorData[];
  /** 获取产物数据 */
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
  bundle(): Promise<void>;
  /** 获取产物数据 */
  getAssets(): AssetData[];
  /** 获取打包后的代码 */
  getBundledCode(): BundlerResult;
  /** 停止运行 */
  dispose(): void | Promise<void>;
}

/** 运行器实例 */
export interface RunnerInstance {
  /** 运行代码 */
  run(source: BundlerResult): Promise<void>;
  /** 获取运行结果 */
  getOutput(): any;
}
