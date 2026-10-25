import type { Hook } from 'tapable';

/** 钩子数据 */
export interface HookData {
  /**
   * 钩子运行起始时间
   *   - 单位毫秒，performance.now() 的单调时钟读数
   */
  startAt: number;
  /**
   * 钩子运行结束时间
   *   - 单位毫秒，performance.now() 的单调时钟读数
   */
  endAt: number;
}

/** 完整数据 */
export interface HookDataWithName {
  /** 插件名称 */
  pluginName: string;
  /** 钩子池名称 */
  mapName: string;
  /** 钩子名称 */
  tapName: string;
  /** 调用次数 */
  count: number;
  /**
   * 平均耗时（单次调用）
   *   - 单位毫秒，保留小数精度
   */
  avgCost: number;
  /**
   * 总耗时（区间合并后，消除并发重叠）
   *   - 单位毫秒，保留小数精度
   */
  totalCost: number;
}

/** 一次构建的插件统计快照，耗时单位为毫秒。 */
export interface HookSummary {
  items: HookDataWithName[];
  globalTotalCost: number;
}

/**
 * 钩子池数据
 *   - 键名为钩子名称
 */
export type HookMapData = Map<string, HookData[]>;

/**
 * 插件数据
 *   - 键名为钩子池名称
 */
export type PluginData = Map<string, HookMapData>;

/**
 * 调试器数据
 *   - 键名为插件名称
 */
export type AllPluginData = Map<string, PluginData>;

/** 任意钩子 */
export type AnyHook = Hook<any, any>;

/** 任意钩子池 */
export type AnyHookMap = Record<string, AnyHook>;
