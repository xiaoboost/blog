import type { CacheAccessor } from './accessor';
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
  /**
   * 输出目录
   *
   * @default './dist'
   */
  outDir?: string;
  /**
   * 构建模式
   *
   * @default 'development'
   */
  mode?: Mode;
  /**
   * 是否启用 HMR
   *
   * @default false
   */
  hmr?: boolean;
  /**
   * 监听模式
   *
   * @default false
   */
  watch?: boolean;
  /**
   * 调试模式
   *
   * @default false
   */
  debug?: boolean;
  /**
   * 命令行输出带颜色
   *
   * @default true
   */
  terminalColor?: boolean;
  /**
   * 日志输出等级
   *
   * @default 'info'
   */
  logLevel?: LogLevel;
  /**
   * 类型检查
   *
   * @default true
   */
  typeCheck?: boolean;
  /**
   * 缓存路径
   *
   * @default '.cache'
   */
  cache?: string;
}

/** 构建器实例 */
export interface BuilderInstance {
  /** 构建器名称 */
  readonly name: string;
  /** 根路径 */
  readonly root: string;
  /** 是否需要构建 */
  readonly shouldBuild: boolean;
  /** 上级构建器 */
  readonly parent?: BuilderInstance;

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
  /**
   * 获取缓存访问器
   *
   * @description 缓存数据将会存入硬盘中，用以提高下次构建的速度
   */
  getCacheAccessor(name: string): CacheAccessor;
  /** 创建子构建器 */
  createChild(opt?: BuilderOptions): Promise<BuilderInstance>;
  /** 添加监听文件 */
  addWatchFiles(...files: string[]): void;
  /** 是否是监听文件 */
  setChangeFiles(...files: string[]): void;
  /**
   * 添加资源文件
   *
   * @description 路径重复时，旧资源将会被覆盖
   */
  emitAsset(...files: AssetData[]): void;
  /**
   * 重命名资源
   *
   * @description 输出为空时表示重命名失败
   */
  renameAsset(file: AssetData): string | undefined;
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
  /**
   * 获取构建产物数据
   *
   * @param {boolean} [includeOutput] 是否包含构建产物本身
   */
  getAssets(includeOutput?: boolean): AssetData[];
  /** 获取打包后的代码 */
  getBundledCode(): BundlerResult;
  /** 停止运行 */
  dispose(): void | Promise<void>;
}

/** 运行器方法 */
export type RunnerCb = (assets: AssetData[]) => Promise<AssetData[]>;

/** 运行器实例 */
export interface RunnerInstance {
  /** 运行代码 */
  run(source: BundlerResult): Promise<void>;
  /** 获取运行结果 */
  getOutput(): any;
}
