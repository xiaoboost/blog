import type { BuilderPlugin } from '@blog/types';

import Moment from 'moment';
import createSpinner from 'ora';

const pluginName = 'logger';

function getShortString(current: number, unit: string) {
  if (current > 100) {
    return `${current} ${unit}`;
  } else if (current > 10) {
    return `${Number(current.toFixed(1))} ${unit}`;
  } else {
    return `${Number(current.toFixed(2))} ${unit}`;
  }
}

function getShortTime(time: number) {
  const units = ['毫秒', '秒', '分钟', '小时'];
  const ranks = [1000, 60, 60, Infinity];

  let current = time;
  let level = 0;

  while (current > ranks[level]) {
    current /= ranks[level];
    level++;
  }

  return getShortString(current, units[level]);
}

function log(...args: any[]) {
  console.log(`[${Moment().format('hh:mm:ss')}]`, ...args);
}

export const LoggerPlugin = (): BuilderPlugin => ({
  name: 'logger',
  apply(builder) {
    const spinner = createSpinner({
      interval: 200,
    });

    let timer: number;

    builder.hooks.bundler.tap(pluginName, () => {
      timer = Date.now();
      spinner.text = '代码打包...';
      spinner.start();
    });

    builder.hooks.runner.tap(pluginName, () => {
      const now = Date.now();
      spinner.clear();
      log(`打包耗时 ${getShortTime(now - timer)}`);
      timer = now;
      spinner.text = '运行构建...';
    });

    builder.hooks.endBuild.tap(pluginName, () => {
      spinner.clear();
      spinner.stop();
      log(`构建耗时 ${getShortTime(Date.now() - timer)}`);
    });
  },
});
