import type {
  AsyncParallelHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';
import type { OnResolveArgs, OnResolveResult, OnLoadResult, OnLoadArgs } from 'esbuild';
import type { FSWatcher } from 'chokidar';
import type { BuilderOptions, BundlerInstance, RunnerInstance } from './builder';
import type { PostUrlMap } from './types';
import type { ErrorData } from './error';
import type { AssetData } from './asset';

export { OnResolveArgs, OnResolveResult, OnLoadResult, OnLoadArgs } from 'esbuild';

/** resolve 回调返回参数 */
export type OnResolveCallbackResult = OnResolveResult | null | undefined | void;

/** load 回调返回参数 */
export type OnLoadCallbackResult = OnLoadResult | null | undefined | void;

/** 钩子上下文数据 */
export interface BuilderHookContext {
  /** 打包器 */
  bundler: BundlerInstance;
  /** 运行器 */
  runner: RunnerInstance;
  /** 监听器 */
  watcher?: FSWatcher;
}

/** 构造器钩子 */
export interface BuilderHooks {
  /**
   * 初始化
   *   - 构建开始之前
   */
  initialization: AsyncSeriesHook<[Required<BuilderOptions>]>;
  /**
   * 开始构建
   *   - 初始化之后
   *   - `watch`模式时每次构建之初
   */
  start: AsyncSeriesHook<[]>;
  /**
   * 编译结束
   *   - watch 模式下，也只会在最后触发
   */
  done: AsyncSeriesHook<[BuilderHookContext]>;
  /**
   * 构建成功
   *   - `watch`模式下，每次成功的构建均会触发
   */
  success: AsyncSeriesHook<[AssetData[], BuilderHookContext]>;
  /**
   * 构建失败
   *   - `watch`模式下，每次失败的构建均会触发
   */
  failed: AsyncSeriesHook<[ErrorData[]]>;
  /**
   * 处理资源
   *   - 返回资源列表数组
   */
  processAssets: AsyncSeriesWaterfallHook<[AssetData[]]>;
  /**
   * 文件变更
   */
  filesChange: AsyncParallelHook<[string[]]>;
  /**
   * 监听器创建后
   */
  watcher: AsyncSeriesHook<[FSWatcher]>;
  /**
   * 打包器创建后
   *   - 运行打包之前
   */
  bundler: AsyncSeriesHook<[BundlerInstance]>;
  /**
   * 运行器创建后
   *   - 运行代码之前
   */
  runner: AsyncSeriesHook<[RunnerInstance]>;
}

/** 打包器钩子 */
export interface BundlerHooks {
  /** 路径请求 */
  resolve: AsyncSeriesBailHook<[OnResolveArgs], OnResolveCallbackResult>;
  /** 读取文件 */
  load: AsyncSeriesBailHook<[OnLoadArgs], OnLoadCallbackResult>;
  /** 路径请求结果 */
  resolveResult: AsyncSeriesHook<[OnResolveResult]>;
  /** 读取文件结果 */
  loadResult: AsyncSeriesHook<[OnLoadResult]>;
}

/** 运行器钩子 */
export interface RuntimeHooks {
  /** 运行开始前 */
  beforeStart: AsyncSeriesHook<[]>;
  /** 组件编译前 */
  beforeComponent: AsyncSeriesHook<[]>;
  /** 组件编译后 */
  afterComponent: AsyncSeriesHook<[]>;
  /** 生成文章路径后 */
  afterPostUrl: AsyncSeriesHook<[PostUrlMap]>;
  /** 编译文章页面前 */
  beforeEachPost: AsyncSeriesHook<[]>;
  /** 编译文章页面后 */
  afterEachPost: AsyncSeriesHook<[]>;
}
