import type { BuildTiming, LoggerInstance } from '@blog/types';
import { table } from 'table';
import { getMdString } from './hooks';
import type { HookSummary } from './hooks/types';

const labels: Record<string, string> = {
  'builder.bundle': '代码打包与检查',
  'builder.generate': '页面生成',
  'builder.output': '资源收尾与写入',
  'generator.prepare': '页面准备',
  'generator.preRender': '预渲染',
  'generator.beforeBuild': '构建前处理',
  'generator.render': '正式渲染与收尾',
};

interface ReportOptions {
  failed: boolean;
  hooks?: HookSummary;
}

function formatTime(milliseconds: number) {
  if (milliseconds < 1) {
    return '< 1 ms';
  }

  return milliseconds < 1000
    ? `${Number(milliseconds.toFixed(3))} ms`
    : `${Number((milliseconds / 1000).toFixed(3))} s`;
}

function getGroups(timings: BuildTiming[]) {
  const parts = timings
    .filter(({ name }) => name !== 'builder.total')
    .slice()
    .sort((a, b) => a.startTime - b.startTime);

  return [
    { title: '构建阶段', timings: parts.filter(({ name }) => name.startsWith('builder.')) },
    { title: '页面生成内部步骤', timings: parts.filter(({ name }) => name.startsWith('generator.')) },
    { title: '其他计时', timings: parts.filter(({ name }) => !name.startsWith('builder.') && !name.startsWith('generator.')) },
  ].filter((group) => group.timings.length > 0);
}

function getRows(timings: BuildTiming[]) {
  return timings.map(({ name, duration }) => [labels[name] ?? name, formatTime(duration)]);
}

function escapeCell(text: string) {
  return text.replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
}

/** 阶段计时与可选的详细插件统计组成同一份 PR 报告。 */
export function getBuildReport(timings: BuildTiming[], { failed, hooks }: ReportOptions) {
  const total = timings.find(({ name }) => name === 'builder.total');
  let content = `# 构建性能报告\n\n- 构建状态：${failed ? '失败' : '成功'}\n`;

  if (total) {
    content += `- 构建总耗时：${formatTime(total.duration)}\n`;
  }

  content += '\n总耗时从本轮构建开始计到完成钩子结束，包含产物写入；不包含 Builder 初始化、报告生成和退出清理。失败时统计到失败处理结束。\n';

  if (failed) {
    content += '\n阶段表只列出已结束的计时；中途抛错的阶段未提交记录，其已消耗的时间仍包含在构建总耗时中。\n';
  }

  for (const group of getGroups(timings)) {
    content += `\n## ${group.title}\n\n|阶段|耗时|\n|:--|--:|\n`;
    content += getRows(group.timings).map((row) => `|${row.map(escapeCell).join('|')}|\n`).join('');
  }

  if (hooks) {
    content += getMdString(hooks);
    content += '\n详细插件统计只覆盖已拦截的钩子区间，与上述阶段存在包含或重叠关系，不能相加。\n\n';
  }

  return content;
}

export function printTimings(logger: LoggerInstance, timings: BuildTiming[], failed: boolean) {
  const total = timings.find(({ name }) => name === 'builder.total');
  logger.info(`构建性能报告：${failed ? '失败' : '成功'}${total ? `，总耗时 ${formatTime(total.duration)}` : ''}`);

  for (const group of getGroups(timings)) {
    logger.info(table([['阶段', '耗时'], ...getRows(group.timings)], {
      header: { alignment: 'center', content: group.title },
      columns: [{ width: 36 }, { width: 14, alignment: 'right' }],
    }));
  }
}
