import { toRound } from '@blog/shared';
import type { LoggerInstance, BuilderInstance } from '@blog/types';
import { table, type SpanningCellConfig, type ColumnUserConfig } from 'table';
import type { DebuggerOptions } from '../types';
import type { HookDataWithName } from './types';
import { hookData, interceptHookMap, getHookData } from './utils';

/** 格式化耗时字符串，入参单位为微秒 */
function toTimeString(input: bigint) {
  // 小于 1 ms 显示为 < 1 ms
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

function getTableData(data: HookDataWithName[]) {
  function getTableRow(item: HookDataWithName) {
    return [
      item.pluginName,
      item.mapName,
      item.tapName,
      String(item.count),
      toTimeString(item.avgCost),
      toTimeString(item.totalCost),
    ];
  }

  const headers = [
    '插件名称', '构建阶段', '钩子函数', '调用次数', '平均耗时', '总耗时',
  ];
  const tableData = data.map(getTableRow);
  const totalSortedTableData = data
    .slice()
    .sort((pre, next) => (pre.totalCost > next.totalCost ? -1 : 1))
    .map(getTableRow);
  const avgSortedTableData = data
    .slice()
    .sort((pre, next) => (pre.avgCost > next.avgCost ? -1 : 1))
    .map(getTableRow);

  tableData.unshift(headers.slice());
  totalSortedTableData.unshift(headers.slice());
  avgSortedTableData.unshift(headers.slice());

  return {
    tableData,
    totalSortedTableData,
    avgSortedTableData,
  };
}

/** 打印到命令行 */
function printHookData(
  data: HookDataWithName[],
  globalTotalCost: bigint,
  logger: LoggerInstance,
) {
  const cells: SpanningCellConfig[] = [];
  const { tableData, totalSortedTableData, avgSortedTableData } = getTableData(data);

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
      startCol1Item.pluginName !== currentItem.pluginName
      || startCol1Item.mapName !== currentItem.mapName
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

  // 处理最后一组的合并
  const lastIndex = data.length;
  if (lastIndex - col0Start > 1) {
    cells.push({
      col: 0,
      row: col0Start + 1,
      rowSpan: lastIndex - col0Start,
    });
  }
  if (lastIndex - col1Start > 1) {
    cells.push({
      col: 1,
      row: col1Start + 1,
      rowSpan: lastIndex - col1Start,
    });
  }

  const columns: ColumnUserConfig[] = [
    { width: 16 },
    { width: 8, alignment: 'center' },
    { width: 14 },
    { width: 8, alignment: 'center' },
    { width: 10 },
    { width: 10 },
  ];
  const tableString = table(tableData, {
    header: {
      alignment: 'center',
      content: '完整插件数据',
    },
    columns,
    spanningCells: cells,
  });
  const totalSortedTableString = table(totalSortedTableData.slice(0, 4), {
    header: {
      alignment: 'center',
      content: '总耗时最多',
    },
    columns,
  });
  const avgSortedTableString = table(avgSortedTableData.slice(0, 4), {
    header: {
      alignment: 'center',
      content: '平均耗时最多',
    },
    columns,
  });

  logger.info(
    `数据记录完成，如下所示——\n${tableString}\n${totalSortedTableString}\n${avgSortedTableString}`,
  );
}

/** 生成记录数据报告 */
export function getMdString() {
  const { items, globalTotalCost } = getHookData();
  const { tableData, totalSortedTableData, avgSortedTableData } = getTableData(items);
  const tableHeader = '|插件名称|构建阶段|钩子函数|调用次数|平均耗时|总耗时|\n|:--|:--|:--|:--:|:--|:--|\n';

  let content = `# 插件数据\n\n## 全局汇总\n\n- 插件活跃总时间: ${toTimeString(globalTotalCost)}\n\n## 总耗时最多\n\n${tableHeader}`;

  totalSortedTableData.slice(1, 4).forEach((item) => (content += `|${item.join('|')}|\n`));
  content += `\n\n## 平均耗时最多\n\n${tableHeader}`;
  avgSortedTableData.slice(1, 4).forEach((item) => (content += `|${item.join('|')}|\n`));
  content += `\n\n## 完整插件数据\n\n${tableHeader}`;
  tableData.slice(1).forEach((item) => (content += `|${item.join('|')}|\n`));

  return content;
}

/** 输出数据 */
export function print(logger: LoggerInstance) {
  const { items, globalTotalCost } = getHookData();
  printHookData(items, globalTotalCost, logger);
}

/** 拦截钩子 */
export function intercept(name: string, builder: BuilderInstance, options: DebuggerOptions) {
  builder.hooks.start.tap(name, () => {
    hookData.clear();
  });

  builder.hooks.afterInitialized.tap(name, (builder) => {
    interceptHookMap('Builder', builder.hooks as any, options);

    builder.hooks.bundler.tap(name, (bundler) => {
      interceptHookMap('Bundler', bundler.hooks as any, options);
    });
  });
}
