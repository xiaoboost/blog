import type { FullTap } from 'tapable';
import type { DebuggerOptions } from '../types';
import type { AllPluginData, AnyHookMap, HookData, HookDataWithName } from './types';

/** 数据储存 */
export const hookData: AllPluginData = new Map();

/** 添加钩子数据 */
function addHookData(plugin: string, hookMap: string, hook: string, startAt: bigint) {
  const endAt = process.hrtime.bigint();

  if (!hookData.has(plugin)) {
    hookData.set(plugin, new Map());
  }

  const pluginData = hookData.get(plugin)!;

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
  });
}

/** 设置钩子拦截器 */
export function interceptHookMap(
  hookMapName: string,
  hookMapData: AnyHookMap,
  options: DebuggerOptions,
) {
  for (const tapName of Object.keys(hookMapData)) {
    const hook = hookMapData[tapName];

    if (!hook?.isUsed?.()) {
      continue;
    }

    hook.intercept({
      register(tap: FullTap) {
        const { fn: cb, name: pluginName, type } = tap;

        // 忽略选项中的钩子
        if ((options.excludes ?? []).includes(pluginName)) {
          return tap;
        }

        if (type === 'sync') {
          tap.fn = function (...args: any[]) {
            const startAt = process.hrtime.bigint();
            const result = cb.apply(this, args);
            addHookData(pluginName, hookMapName, tapName, startAt);
            return result;
          };
        }
        else if (type === 'async') {
          tap.fn = async function (...args: any[]) {
            const startAt = process.hrtime.bigint();
            const result = await cb.apply(this, args);
            addHookData(pluginName, hookMapName, tapName, startAt);
            return result;
          };
        }
        else if (type === 'promise') {
          tap.fn = function (...args: any[]) {
            const startAt = process.hrtime.bigint();
            return cb.apply(this, args).then((result: unknown) => {
              addHookData(pluginName, hookMapName, tapName, startAt);
              return result;
            });
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
 *   - 入参/出参单位均为`纳秒`
 */
function mergeIntervals(intervals: Array<{ startAt: bigint; endAt: bigint }>): bigint {
  if (intervals.length === 0) return 0n;

  const sorted = intervals.slice().sort((a, b) =>
    a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0,
  );

  let total = 0n;
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
export function getHookData(): { items: HookDataWithName[]; globalTotalCost: bigint } {
  const result: HookDataWithName[] = [];
  const allIntervals: Array<{ startAt: bigint; endAt: bigint }> = [];

  for (const [pluginName, pluginData] of hookData.entries()) {
    for (const [mapName, mapData] of pluginData.entries()) {
      for (const [tapName, intervals] of mapData.entries()) {
        const count = intervals.length;
        const sumCost = intervals.reduce(
          (ans, item) => ans + (item.endAt - item.startAt),
          0n,
        );
        const totalCost = mergeIntervals(intervals);

        // 汇总所有区间用于计算全局墙钟时间
        allIntervals.push(...intervals);

        result.push({
          pluginName,
          mapName,
          tapName,
          count,
          // 平均耗时 = 累加总时间 / 调用次数，转为微秒
          avgCost: sumCost / BigInt(count) / 1000n,
          // 总耗时 = 区间合并后的墙钟时间，转为微秒
          totalCost: totalCost / 1000n,
        });
      }
    }
  }

  const globalTotalCost = mergeIntervals(allIntervals) / 1000n;

  return { items: result, globalTotalCost };
}
