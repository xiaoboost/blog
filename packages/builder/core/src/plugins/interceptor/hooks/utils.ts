import { performance } from 'node:perf_hooks';
import type { FullTap } from 'tapable';
import type { DebuggerOptions } from '../types';
import type {
  AllPluginData,
  AnyHookMap,
  HookDataWithName,
  HookSummary,
} from './types';

/** 数据储存 */
export const hookData: AllPluginData = new Map();

/** 添加钩子数据 */
function addHookData(
  data: AllPluginData,
  plugin: string,
  hookMap: string,
  hook: string,
  startAt: number,
  effective?: boolean,
) {
  const endAt = performance.now();

  if (!data.has(plugin)) {
    data.set(plugin, new Map());
  }

  const pluginData = data.get(plugin)!;

  if (!pluginData.has(hookMap)) {
    pluginData.set(hookMap, new Map());
  }

  const hookMapData = pluginData.get(hookMap)!;

  if (!hookMapData.has(hook)) {
    hookMapData.set(hook, []);
  }

  hookMapData.get(hook)!.push({
    startAt,
    endAt,
    effective,
  });
}

/** 根据各钩子的返回约定判断有效处理，其他钩子只统计全部调用。 */
function getEffectiveCheck(hookMap: string, hook: string) {
  if (hookMap === 'Bundler' && (hook === 'resolve' || hook === 'load')) {
    return (_input: unknown, result: unknown) => result != null;
  }

  if ((hookMap === 'Bundler' && hook === 'transform')
    || (hookMap === 'Builder' && hook === 'processAssets')) {
    return (input: unknown, result: unknown) => result != null && result !== input;
  }
}

/** 设置钩子拦截器 */
export function interceptHookMap(
  hookMapName: string,
  hookMapData: AnyHookMap,
  options: DebuggerOptions,
  data: AllPluginData = hookData,
) {
  for (const tapName of Object.keys(hookMapData)) {
    const hook = hookMapData[tapName];

    if (!hook?.intercept) {
      continue;
    }

    const isEffective = getEffectiveCheck(hookMapName, tapName);

    hook.intercept({
      register(tap: FullTap) {
        const { fn: cb, name: pluginName, type } = tap;

        // 忽略选项中的钩子
        if ((options.excludes ?? []).includes(pluginName)) {
          return tap;
        }

        if (type === 'sync') {
          tap.fn = function (...args: any[]) {
            const startAt = performance.now();
            let result;
            try {
              result = cb.apply(this, args);
              return result;
            }
            finally {
              const effective = isEffective?.(args[0], result);
              addHookData(data, pluginName, hookMapName, tapName, startAt, effective);
            }
          };
        }
        else if (type === 'async') {
          tap.fn = function (...args: any[]) {
            const startAt = performance.now();
            const callback = args.pop();
            let recorded = false;
            const record = (result: unknown) => {
              if (recorded) {
                return;
              }

              recorded = true;
              const effective = isEffective?.(args[0], result);
              addHookData(data, pluginName, hookMapName, tapName, startAt, effective);
            };

            try {
              return cb.call(this, ...args, (...result: any[]) => {
                record(result[0] ? undefined : result[1]);
                callback(...result);
              });
            }
            catch (error) {
              record(undefined);
              throw error;
            }
          };
        }
        else if (type === 'promise') {
          tap.fn = async function (...args: any[]) {
            const startAt = performance.now();
            let result;
            try {
              result = await cb.apply(this, args);
              return result;
            }
            finally {
              const effective = isEffective?.(args[0], result);
              addHookData(data, pluginName, hookMapName, tapName, startAt, effective);
            }
          };
        }

        return tap;
      },
    });
  }
}

/**
 * 合并重叠的时间区间，返回合并后的总时长
 *   - 将所有 [startAt, endAt] 在时间轴上合并重叠部分，消除并发导致的时间重复计算
 *   - 入参/出参单位均为毫秒，保留小数精度
 */
function mergeIntervals(intervals: Array<{ startAt: number; endAt: number }>): number {
  if (intervals.length === 0) {
    return 0;
  }

  const sorted = intervals.slice().sort((a, b) =>
    a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0,
  );

  let total = 0;
  let curStart = sorted[0].startAt;
  let curEnd = sorted[0].endAt;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startAt <= curEnd) {
      // 重叠或相邻，扩展当前区间
      if (sorted[i].endAt > curEnd) {
        curEnd = sorted[i].endAt;
      }
    }
    else {
      // 不重叠，结算当前区间，开始新区间
      total += curEnd - curStart;
      curStart = sorted[i].startAt;
      curEnd = sorted[i].endAt;
    }
  }

  // 结算最后一个区间
  total += curEnd - curStart;
  return total;
}

/** 获取所有数据 */
export function getHookData(data: AllPluginData = hookData): HookSummary {
  const result: HookDataWithName[] = [];
  const allIntervals: Array<{ startAt: number; endAt: number }> = [];

  for (const [pluginName, pluginData] of data.entries()) {
    for (const [mapName, mapData] of pluginData.entries()) {
      for (const [tapName, intervals] of mapData.entries()) {
        const count = intervals.length;
        const sumCost = intervals.reduce(
          (ans, item) => ans + (item.endAt - item.startAt),
          0,
        );
        const totalCost = mergeIntervals(intervals);
        const effectiveIntervals = intervals.filter((item) => item.effective === true);
        const effectiveCount = intervals.some((item) => item.effective !== undefined)
          ? effectiveIntervals.length
          : undefined;
        const effectiveSumCost = effectiveIntervals.reduce(
          (ans, item) => ans + (item.endAt - item.startAt),
          0,
        );
        const effectiveAvgCost = effectiveIntervals.length > 0
          ? effectiveSumCost / effectiveIntervals.length
          : undefined;

        // 汇总所有区间用于计算全局墙钟时间
        allIntervals.push(...intervals);

        result.push({
          pluginName,
          mapName,
          tapName,
          count,
          effectiveCount,
          // 平均耗时 = 累加总时间 / 调用次数，不在统计时舍入
          avgCost: count > 0 ? sumCost / count : 0,
          effectiveAvgCost,
          // 活跃时间包含全部调用，保留未生效和失败调用的耗时。
          totalCost,
        });
      }
    }
  }

  const globalTotalCost = mergeIntervals(allIntervals);

  return { items: result, globalTotalCost };
}
