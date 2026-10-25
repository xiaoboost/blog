import { toRound } from '@blog/shared';
import type { LoggerInstance, BuilderInstance } from '@blog/types';
import { table, type SpanningCellConfig, type ColumnUserConfig } from 'table';
import type { DebuggerOptions } from '../types';
import type { AllPluginData, HookDataWithName, HookSummary } from './types';
import { interceptHookMap, getHookData } from './utils';

/** 格式化耗时字符串，入参单位为毫秒；只在展示时舍入。 */
function toTimeString(input: number) {
  // 小于 1 ms 显示为 < 1 ms
  if (input < 1) {
    return '< 1 ms';
  }

  const unit = ['ms', 's'];

  let target = input;
  let index = 0;

  while (target >= 1000 && index < unit.length - 1) {
    target /= 1000;
    index++;
  }

  return `${toRound(target, 3)} ${unit[index]}`;
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
    '插件名称',
    '构建阶段',
    '钩子函数',
    '调用次数',
    '平均耗时',
    '总耗时',
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
  globalTotalCost: number,
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
export function getMdString(data: HookSummary = getHookData()) {
  const { items, globalTotalCost } = data;
  const { tableData, totalSortedTableData, avgSortedTableData } = getTableData(items);
  const tableHeader = '|插件名称|构建阶段|钩子函数|调用次数|平均耗时|总耗时|\n|:--|:--|:--|:--:|:--|:--|\n';

  let content = `## 全局汇总\n\n- 插件活跃总时间: ${toTimeString(globalTotalCost)}\n\n## 总耗时最多\n\n${tableHeader}`;

  totalSortedTableData.slice(1, 4).forEach((item) => (content += `|${item.join('|')}|\n`));
  content += `\n\n## 平均耗时最多\n\n${tableHeader}`;
  avgSortedTableData.slice(1, 4).forEach((item) => (content += `|${item.join('|')}|\n`));
  content += `\n\n## 完整插件数据\n\n${tableHeader}`;
  tableData.slice(1).forEach((item) => (content += `|${item.join('|')}|\n`));

  return content;
}

/** 输出数据 */
export function print(logger: LoggerInstance, data: HookSummary = getHookData()) {
  const { items, globalTotalCost } = data;
  printHookData(items, globalTotalCost, logger);
}

/** 拦截钩子 */
export function intercept(
  name: string,
  builder: BuilderInstance,
  data: AllPluginData,
  options: DebuggerOptions,
) {
  builder.hooks.start.tap({ name, stage: -Infinity }, () => {
    data.clear();
  });

  builder.hooks.afterInitialized.tap(name, (builder) => {
    interceptHookMap('Builder', builder.hooks as any, options, data);

    builder.hooks.bundler.tap(name, (bundler) => {
      interceptHookMap('Bundler', bundler.hooks as any, options, data);
    });
  });
}
