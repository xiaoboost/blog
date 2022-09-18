import type {
  AsyncParallelHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} from 'tapable';

import type { BuilderOptions } from './builder';

/** 钩子接口 */
export interface BuilderHooks {
  /**
   * 初始化
   *   - 配置读取完成，但还未应用到构建器中时
   */
  initialize: AsyncSeriesHook<[BuilderOptions]>;
  /**
   * 开始构建
   *   - 初始化之后，构建开始之时
   */
  startBuild: AsyncSeriesHook<[]>;
  /**
   * 结束构建
   *   - watch 模式下，每次编译结束均会触发
   */
  endBuild: AsyncSeriesHook<[]>;
  /**
   * 此次编译结束
   *   - watch 模式下，也只会在最后触发
   */
  done: AsyncSeriesHook<[]>;
  /** 文件变更 */
  watchChange: AsyncParallelHook<string[]>;
  /** 路径路由 */
  resolve: AsyncSeriesBailHook<[ResolveArgs], ResolveResult | undefined>;
  /** 读取文件 */
  load: AsyncSeriesBailHook<[ResolveArgs], ResolveResult | undefined>;
  /** 转换文件 */
  transform: AsyncSeriesWaterfallHook<[Source]>;

  /** 模板初始化 */
  templateInit: any;
  /** 模板预构建 */
  templatePreBuild: any;
  /** 输出静态资源 */
}

/** 运行器钩子 */
export interface RunnerHooks {
  //..
}
