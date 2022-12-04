import type { BuilderPlugin } from '@blog/types';
import { Instance } from 'chalk';

import Moment from 'moment';
import createSpinner from 'ora';

import { getPrefixConsole } from '../utils';

const pluginName = 'logger-plugin';

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

export const Logger = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { terminalColor: color } = builder.options;
    const printer = new Instance({ level: color ? 3 : 0 });
    const logger = getPrefixConsole(() => printer.green(`[${Moment().format('HH:mm:ss')}]`));
    const spinner = createSpinner({
      interval: 200,
      color: color ? 'blue' : undefined,
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
      logger.log(`打包耗时 ${getShortTime(now - timer)}`);
      timer = now;
      spinner.text = '运行构建...';
    });

    builder.hooks.endBuild.tap(pluginName, () => {
      spinner.clear();
      spinner.stop();
      logger.log(`构建耗时 ${getShortTime(Date.now() - timer)}`);
    });

    builder.hooks.filesChange.tap(pluginName, (files) => {
      // ..
    });

    builder.hooks.fail.tap(pluginName, () => {
      spinner.stop();
      spinner.clear();
    });
  },
});
