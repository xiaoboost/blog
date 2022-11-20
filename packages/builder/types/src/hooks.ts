import type { AsyncParallelHook, AsyncSeriesHook, AsyncSeriesBailHook } from 'tapable';
import type { OnResolveArgs, OnResolveResult, OnLoadResult, OnLoadArgs } from 'esbuild';
import type { BuilderOptions, BundlerInstance, RunnerInstance } from './builder';
import type { PostUrlMap } from './types';

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
