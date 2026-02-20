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
import type { PostExportData, PostBasicData } from './post';

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

/** 列表数据 */
interface ListRenderData {
  /** 列表第几页 */
  index: number;
  /** 列表总页数 */
  count: number;
  /** 列表页网址 */
  pathname: string;
}

/** 列表页数据 */
export interface PostListData extends ListRenderData {
  /** 列表页包含的文章 */
  posts: PostExportData[];
}

/** 带标题的列表页数据 */
export interface PostListDataWithTitle extends PostListData {
  /** 列表标题 */
  listTitle: string;
}

/** 链接数据 */
interface UrlData {
  /** 链接标题 */
  title: string;
  /** 链接副标题 */
  subTitle: string;
  /** 链接地址 */
  url: string;
}

/** 项目列表页数据 */
export interface UrlListData extends ListRenderData {
  /** 列表标题 */
  listTitle: string;
  /** 项目列表 */
  data: UrlData[];
}

/** 运行器钩子 */
export interface RuntimeHooks {
  /** 运行开始前 */
  beforeStart: AsyncSeriesHook<[]>;
  /** 文章数据准备完成 */
  afterPostDataReady: AsyncSeriesHook<[PostBasicData[]]>;
  /** 预构建开始前 */
  beforePreBuild: AsyncSeriesHook<[]>;
  /** 预构建完成后 */
  afterPreBuild: AsyncSeriesWaterfallHook<[AssetData[]]>;
  /** 编译文章页面前 */
  beforeEachPost: AsyncSeriesHook<[PostExportData, number, PostExportData[]]>;
  /** 编译文章页面后 */
  afterEachPost: AsyncSeriesHook<[AssetData, number, PostExportData[]]>;
  /** 编译标签列表页前 */
  beforeEachTagList: AsyncSeriesHook<[UrlListData]>;
  /** 编译标签列表页后 */
  afterEachTagList: AsyncSeriesHook<[AssetData]>;
  /** 编译标签文章列表页前 */
  beforeEachTagPostList: AsyncSeriesHook<[PostListDataWithTitle]>;
  /** 编译标签文章列表页后 */
  afterEachTagPostList: AsyncSeriesHook<[AssetData]>;
  /** 编译年份列表页前 */
  beforeEachYearList: AsyncSeriesHook<[UrlListData]>;
  /** 编译年份列表页后 */
  afterEachYearList: AsyncSeriesHook<[AssetData]>;
  /** 编译年份文章列表页前 */
  beforeEachYearPostList: AsyncSeriesHook<[PostListDataWithTitle]>;
  /** 编译年份文章列表页后 */
  afterEachYearPostList: AsyncSeriesHook<[AssetData]>;
  /** 编译主列表页前 */
  beforeEachMainIndexList: AsyncSeriesHook<[PostListData]>;
  /** 编译列主表页后 */
  afterEachMainIndexList: AsyncSeriesHook<[AssetData]>;
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
