import type { FullTap } from 'tapable';
import type { BuilderInstance, LoggerInstance } from '@blog/types';
import { table, SpanningCellConfig } from 'table';
import type {
  AllPluginData,
  AnyHookMap,
  DebuggerOptions,
  HookData,
  HookDataWithName,
} from './types';

/** 数据储存 */
const data: AllPluginData = new Map();

/** 添加钩子数据 */
function addHookData(plugin: string, hookMap: string, hook: string, startAt: bigint) {
  const endAt = process.hrtime.bigint();

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
  });
}

/** 设置钩子拦截器 */
function interceptHookMap(
  hookMapName: string,
  hookMapData: AnyHookMap,
  options: Required<DebuggerOptions>,
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
        if (options.excludes.includes(pluginName)) {
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
function getHookData(): HookDataWithName[] {
  const result: HookDataWithName[] = [];

  function sum(data: HookData[]) {
    return data.reduce((ans, item): bigint => ans + (item.endAt - item.startAt), 0n) / 1000n;
  }

  for (const [pluginName, pluginData] of data.entries()) {
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

/** 打印数据 */
export function printHookData(logger: LoggerInstance) {
  // 初始单位为微秒
  function toTimeString(input: bigint) {
    if (input < 1000n) {
      return '< 1 ms';
    }

    const unit = ['ms', 's'];

    let target = input / 1000n;
    let index = 0;

    while (target > 1000n && index < 2) {
      target /= 1000n;
      index++;
    }

    return `${target} ${unit[index]}`;
  }

  const result = getHookData();
  const cells: SpanningCellConfig[] = [];
  const tableData = result.map((item) => {
    return [item.pluginName, item.mapName, item.tapName, toTimeString(item.cost)];
  });

  let col0Start = 0;
  let col1Start = 0;

  for (let i = 1; i < result.length; i++) {
    const startCol0Item = result[col0Start];
    const startCol1Item = result[col1Start];
    const currentItem = result[i];

    if (startCol0Item.pluginName !== currentItem.pluginName) {
      if (i - col0Start > 1) {
        cells.push({
          col: 0,
          row: col0Start + 1,
          rowSpan: i - col0Start,
        });
      }

      col0Start = i;
    }

    if (
      startCol1Item.pluginName !== currentItem.pluginName ||
      startCol1Item.mapName !== currentItem.mapName
    ) {
      if (i - col1Start > 1) {
        cells.push({
          col: 1,
          row: col1Start + 1,
          rowSpan: i - col1Start,
        });
      }

      col1Start = i;
    }
  }

  tableData.unshift(['插件名称', '构建阶段', '钩子函数', '总耗时']);

  logger.info(
    `数据记录完成，如下所示——\n${table(tableData, {
      header: {
        alignment: 'center',
        content: '插件数据报告',
      },
      columns: [
        {
          width: 16,
        },
        {
          width: 8,
          alignment: 'center',
        },
        {
          width: 14,
        },
        {
          width: 10,
        },
      ],
      spanningCells: cells,
    })}`,
  );
}

/** 拦截钩子 */
export function intercept(
  name: string,
  builder: BuilderInstance,
  options: Required<DebuggerOptions>,
) {
  builder.hooks.afterInitialized.tap(name, (builder) => {
    interceptHookMap('Builder', builder.hooks as {}, options);

    builder.hooks.bundler.tap(name, (bundler) => {
      interceptHookMap('Bundler', bundler.hooks as {}, options);
    });
  });
}

/** 清空数据 */
export function clear() {
  data.clear();
}
