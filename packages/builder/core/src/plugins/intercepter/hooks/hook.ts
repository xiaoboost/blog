import { table, SpanningCellConfig, ColumnUserConfig } from 'table';
import { toRound } from '@blog/shared';
import type { LoggerInstance, BuilderInstance } from '@blog/types';
import type { DebuggerOptions } from '../types';
import type { HookDataWithName } from './types';
import { hookData, interceptHookMap, getHookData } from './utils';

function getTableData(data: HookDataWithName[]) {
  // 初始单位为微秒
  function toTimeString(input: bigint) {
    // 小于 10 ms 都忽略
    if (input < 1000n) {
      return '< 1 ms';
    }

    const unit = ['ms', 's'];

    let target = toRound(Number(input) / 1000, 3);
    let index = 0;

    while (target > 1000n && index < 2) {
      target = toRound(target / 1000, 3);
      index++;
    }

    return `${target} ${unit[index]}`;
  }

  function getTableRow(item: HookDataWithName) {
    return [item.pluginName, item.mapName, item.tapName, toTimeString(item.cost)];
  }

  const headers = ['插件名称', '构建阶段', '钩子函数', '总耗时'];
  const tableData = data.map(getTableRow);
  const sortedTableData = data
    .slice()
    .sort((pre, next) => (pre.cost > next.cost ? -1 : 1))
    .map(getTableRow);

  tableData.unshift(headers.slice());
  sortedTableData.unshift(headers.slice());

  return {
    tableData,
    sortedTableData,
  };
}

/** 打印到命令行 */
function printHookData(data: HookDataWithName[], logger: LoggerInstance) {
  const cells: SpanningCellConfig[] = [];
  const { tableData, sortedTableData } = getTableData(data);

  let col0Start = 0;
  let col1Start = 0;

  for (let i = 1; i < data.length; i++) {
    const startCol0Item = data[col0Start];
    const startCol1Item = data[col1Start];
    const currentItem = data[i];

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

  const columns: ColumnUserConfig[] = [
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
  ];
  const tableString = table(tableData, {
    header: {
      alignment: 'center',
      content: '完整插件数据',
    },
    columns,
    spanningCells: cells,
  });
  const sortedTableString = table(sortedTableData.slice(0, 4), {
    header: {
      alignment: 'center',
      content: '耗时最多的插件数据',
    },
    columns,
  });

  logger.info(`数据记录完成，如下所示——\n${tableString}\n${sortedTableString}`);
}

/** 生成记录数据报告 */
export function getMdString() {
  const { tableData, sortedTableData } = getTableData(getHookData());
  const tableHeader = `|插件名称|构建阶段|钩子函数|总耗时|\n|:--|:--|:--|:--|\n`;

  let content = `# 插件数据\n\n## 耗时最多的插件\n\n${tableHeader}`;

  sortedTableData.slice(1, 4).forEach((item) => (content += `|${item.join('|')}|\n`));
  content += `\n\n## 完整插件数据\n\n${tableHeader}`;
  tableData.forEach((item) => (content += `|${item.join('|')}|\n`));

  return content;
}

/** 输出数据 */
export function print(logger: LoggerInstance) {
  printHookData(getHookData(), logger);
}

/** 拦截钩子 */
export function intercept(name: string, builder: BuilderInstance, options: DebuggerOptions) {
  builder.hooks.afterInitialized.tap(name, (builder) => {
    interceptHookMap('Builder', builder.hooks as {}, options);

    builder.hooks.bundler.tap(name, (bundler) => {
      interceptHookMap('Bundler', bundler.hooks as {}, options);
    });
  });
}

/** 清空数据 */
export function clear() {
  hookData.clear();
}
