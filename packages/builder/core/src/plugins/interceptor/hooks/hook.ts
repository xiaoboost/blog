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

const statisticsNote = '有效处理按各钩子的返回结果判定。调用平均覆盖全部调用，有效平均只覆盖有效调用。耗时包含异步等待，活跃时间对并发重叠区间去重。— 表示该指标不适用或没有可计算的样本。';

function getTableData(data: HookDataWithName[]) {
  const headers = ['插件名称', '构建阶段', '钩子函数'];
  const identity = (item: HookDataWithName) => [item.pluginName, item.mapName, item.tapName];
  const counts = (item: HookDataWithName) => `${item.effectiveCount ?? '—'} / ${item.count}`;
  const totalSorted = data.slice().sort((a, b) => b.totalCost - a.totalCost).slice(0, 3);
  const effectiveSorted = data
    .filter((item) => (item.effectiveCount ?? 0) > 0 && item.effectiveAvgCost !== undefined)
    .sort((a, b) => b.effectiveAvgCost! - a.effectiveAvgCost!)
    .slice(0, 3);

  return [
    {
      title: '活跃时间最多',
      rows: [
        [...headers, '有效 / 全部', '活跃时间'],
        ...totalSorted.map((item) =>
          [...identity(item), counts(item), toTimeString(item.totalCost)],
        ),
      ],
    },
    {
      title: '平均有效处理耗时最多',
      rows: [
        [...headers, '有效次数', '有效平均'],
        ...effectiveSorted.map((item) =>
          [...identity(item), String(item.effectiveCount), toTimeString(item.effectiveAvgCost!)],
        ),
      ],
    },
    {
      title: '完整插件数据',
      rows: [
        [
          ...headers,
          '有效 / 全部',
          '调用平均',
          '有效平均',
          '活跃时间',
        ],
        ...data.map((item) => [
          ...identity(item),
          counts(item),
          toTimeString(item.avgCost),
          item.effectiveAvgCost === undefined ? '—' : toTimeString(item.effectiveAvgCost),
          toTimeString(item.totalCost),
        ]),
      ],
    },
  ];
}

/** 打印到命令行 */
function printHookData(
  data: HookDataWithName[],
  globalTotalCost: number,
  logger: LoggerInstance,
) {
  const cells: SpanningCellConfig[] = [];
  const tables = getTableData(data);

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
    { width: 22 },
    { width: 8, alignment: 'center' },
    { width: 14 },
    { width: 13, alignment: 'right' },
    { width: 10, alignment: 'right' },
    { width: 10, alignment: 'right' },
    { width: 10, alignment: 'right' },
  ];
  const tableStrings = tables.map(({ title, rows }) => table(rows, {
    header: {
      alignment: 'center',
      content: title,
    },
    columns: columns.slice(0, rows[0].length),
    spanningCells: title === '完整插件数据' ? cells : [],
  }));

  logger.info(
    `插件活跃总时间 ${toTimeString(globalTotalCost)}\n\n${tableStrings.join('\n')}\n${statisticsNote}`,
  );
}

/** 生成记录数据报告 */
export function getMdString(data: HookSummary = getHookData()) {
  const { items, globalTotalCost } = data;
  let content = `## 全局汇总\n\n- 插件活跃总时间 ${toTimeString(globalTotalCost)}\n`;

  for (const { title, rows } of getTableData(items)) {
    const [headers, ...body] = rows;
    const alignment = headers.map((_, index) => index < 3 ? ':--' : '--:');
    content += `\n## ${title}\n\n|${headers.join('|')}|\n|${alignment.join('|')}|\n`;
    const formattedRows = body.map((row) => {
      const cells = row.map((cell) => cell.replaceAll('|', '\\|').replace(/\r?\n/g, ' '));
      return `|${cells.join('|')}|\n`;
    });
    content += formattedRows.join('');
  }

  return `${content}\n> ${statisticsNote}\n`;
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
