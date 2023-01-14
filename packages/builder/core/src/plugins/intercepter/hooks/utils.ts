import type { FullTap } from 'tapable';
import type { AllPluginData, AnyHookMap, HookData, HookDataWithName } from './types';
import type { DebuggerOptions } from '../types';

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
        } else if (type === 'async') {
          tap.fn = async function (...args: any[]) {
            const startAt = process.hrtime.bigint();
            const result = await cb.apply(this, args);
            addHookData(pluginName, hookMapName, tapName, startAt);
            return result;
          };
        } else if (type === 'promise') {
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

/** 获取所有数据 */
export function getHookData(): HookDataWithName[] {
  const result: HookDataWithName[] = [];

  function sum(data: HookData[]) {
    return data.reduce((ans, item): bigint => ans + (item.endAt - item.startAt), 0n) / 1000n;
  }

  for (const [pluginName, pluginData] of hookData.entries()) {
    for (const [mapName, mapData] of pluginData.entries()) {
      for (const [tapName, hookData] of mapData.entries()) {
        result.push({
          pluginName,
          mapName,
          tapName,
          count: hookData.length,
          cost: sum(hookData),
        });
      }
    }
  }

  return result;
}
