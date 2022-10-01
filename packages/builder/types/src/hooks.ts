import type { SyncHook, AsyncParallelHook, AsyncSeriesHook, AsyncSeriesBailHook } from 'tapable';
import type { BuildOptions, OnResolveArgs, ResolveResult, OnLoadArgs, OnLoadResult } from 'esbuild';
import type { PostUrlMap } from './types';
import type { BuilderOptions } from './builder';

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
   */
  endBuild: AsyncSeriesHook<[]>;
  /**
   * 编译结束
   *   - watch 模式下，也只会在最后触发
   */
  done: AsyncSeriesHook<[]>;
  /**
   * 构建失败
   *   - 不会中断 watch 模式
   */
  fail: AsyncSeriesHook<[Error[]]>;
  /**
   * 文件变更
   */
  filesChange: AsyncParallelHook<string[]>;
  /**
   * 打包器创建后
   *   - 运行打包之前
   */
  bundler: AsyncSeriesHook<[]>;
  /**
   * 运行器创建后
   *   - 运行代码之前
   */
  runner: AsyncSeriesHook<[string]>;
}

/** 打包器钩子 */
export interface BundlerHooks {
  /**
   * 构建前生成配置
   *   - 返回的所有配置将会被合并
   */
  configuration: SyncHook<[], BuildOptions | undefined>;
  /** 路径路由 */
  resolve: AsyncSeriesBailHook<[OnResolveArgs], ResolveResult | undefined>;
  /** 读取文件 */
  load: AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined>;
}

/** 运行器钩子 */
export interface RunnerHooks {
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
