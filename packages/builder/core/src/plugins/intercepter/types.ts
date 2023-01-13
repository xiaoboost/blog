import type { Hook } from 'tapable';

/** 调试器选项 */
export interface DebuggerOptions {
  /** 排除的插件 */
  excludes?: string[];
}

/** 钩子数据 */
export interface HookData {
  /**
   * 钩子运行起始时间
   *   - 单位`纳秒`
   */
  startAt: bigint;
  /**
   * 钩子运行结束时间
   *   - 单位`微秒`
   */
  endAt: bigint;
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
   * 总耗时
   *   - 单位`纳秒`
   */
  cost: bigint;
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
