import type {
  AsyncParallelHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
  SyncWaterfallHook,
  SyncHook,
} from 'tapable';
import type {
  OnResolveArgs,
  OnResolveResult,
  OnLoadResult,
  OnLoadArgs,
  BuildOptions,
} from 'esbuild';
import type { FSWatcher } from 'chokidar';
import type { BuilderOptions, BuilderInstance, BundlerInstance, RunnerInstance } from './builder';
import type { ErrorData } from './error';
import type { AssetData } from './asset';
import type { PostUrlMap, PostExportData } from './post';

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
  initialization: SyncHook<[Required<BuilderOptions>]>;
  /**
   * 初始化之后
   *   - watch 模式下，也只会运行一次
   */
  afterInitialized: SyncHook<[BuilderInstance]>;
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
  bundler: SyncHook<[BundlerInstance]>;
  /**
   * 打包代码完成
   */
  afterBundler: AsyncSeriesHook<[BuilderHookContext]>;
  /**
   * 运行器创建后
   *   - 运行代码之前
   */
  runner: SyncHook<[RunnerInstance]>;
  /**
   * 运行代码完成
   */
  afterRunner: AsyncSeriesHook<[BuilderHookContext]>;
}

/** 打包器钩子 */
export interface BundlerHooks {
  /**
   * 初始化
   *   - 构建开始之前
   */
  initialization: SyncWaterfallHook<[BuildOptions]>;
  /** 路径请求 */
  resolve: AsyncSeriesBailHook<[OnResolveArgs], OnResolveCallbackResult>;
  /** 读取文件 */
  load: AsyncSeriesBailHook<[OnLoadArgs], OnLoadCallbackResult>;
  /** 路径请求结果 */
  resolveResult: AsyncSeriesHook<[OnResolveResult, OnResolveArgs]>;
  /** 读取文件结果 */
  loadResult: AsyncSeriesHook<[OnLoadResult, OnLoadArgs]>;
}

/** 列表页数据 */
export interface ListRenderData {
  /** 列表第几页 */
  index: number;
  /** 列表总页数 */
  count: number;
  /** 列表页网址 */
  pathname: string;
  /** 列表页包含的文章 */
  posts: PostExportData[];
}

/** 运行器钩子 */
export interface RuntimeHooks {
  /** 运行开始前 */
  beforeStart: AsyncSeriesHook<[]>;
  /**
   * 生成文章网址后
   *   - 文章路径到网址的映射
   */
  afterPostUrl: AsyncSeriesHook<[PostUrlMap]>;
  /** 编译文章页面前 */
  beforeEachPost: AsyncSeriesHook<[PostExportData, number, PostExportData[]]>;
  /** 编译文章页面后 */
  afterEachPost: AsyncSeriesHook<[AssetData, number, PostExportData[]]>;
  /** 编译列表页面前 */
  beforeEachList: AsyncSeriesHook<[ListRenderData]>;
  /** 编译列表页面后 */
  afterEachList: AsyncSeriesHook<[AssetData]>;
  /**
   * 处理资源
   *   - 返回资源列表数组
   */
  processAssets: AsyncSeriesWaterfallHook<[AssetData[]]>;
  /**
   * 完成构建
   *   - 资源数组
   */
  afterBuild: AsyncSeriesHook<[AssetData[]]>;
}
