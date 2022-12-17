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

/** 构造器钩子 */
export interface BuilderHooks {
  /**
   * 初始化
   *   - 构建开始之前
   */
  initialization: AsyncSeriesHook<[Required<BuilderOptions>]>;
  /**
   * 此次编译结束
   *   - watch 模式下，每次编译结束均会触发
   *   - 两个参数分别是**产物数据**和**错误数据**
   */
  endBuild: AsyncSeriesHook<[AssetData[], ErrorData[]]>;
  /**
   * 编译结束
   *   - watch 模式下，也只会在最后触发
   */
  done: AsyncSeriesHook<[]>;
  /**
   * 构建失败
   *   - 不会中断 watch 模式
   */
  failed: AsyncSeriesHook<[ErrorData[]]>;
  /**
   * 处理资源
   *   - 两个参数分别是打包器输出的资源和运行器输出的资源
   */
  processAssets: AsyncSeriesHook<[AssetData[], AssetData[]]>;
  /**
   * 优化资源
   */
  optimizeAssets: AsyncSeriesWaterfallHook<[AssetData[]]>;
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
  /** 路径路由 */
  resolve: AsyncSeriesBailHook<[OnResolveArgs], OnResolveResult | undefined | null>;
  /** 读取文件 */
  load: AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined | null>;
  /** 读取资源 */
  loadAsset: AsyncSeriesBailHook<[OnLoadArgs], Buffer | undefined | null>;
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
