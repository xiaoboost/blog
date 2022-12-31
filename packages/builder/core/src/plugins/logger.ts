import type { BuilderPlugin, AssetData } from '@blog/types';
import { Instance } from 'chalk';
import { relative } from 'path';

import Moment from 'moment';
import createSpinner from 'ora';

import { Logger as Console } from '../utils';

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

function getShortSize(size: number) {
  const units = ['B', 'kB', 'MB', 'GB'];

  let current = size;
  let rank = 0;

  while (current > 1024) {
    current /= 1024;
    rank++;
  }

  return getShortString(current, units[rank]);
}

function getSize(assets: AssetData[]) {
  return assets.reduce((ans, item) => ans + item.content.byteLength, 0);
}

export const Logger = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options, root } = builder;
    const { terminalColor: color, logLevel } = options;
    const printer = new Instance({ level: color ? 3 : 0 });
    const logger = new Console(() => printer.green(`[${Moment().format('HH:mm:ss')}]`), logLevel);
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

    builder.hooks.filesChange.tap(pluginName, (files) => {
      for (const file of files) {
        logger.info(`${printer.yellow('[文件变更]')}`, relative(root, file));
      }
    });

    builder.hooks.success.tap(pluginName, (assets) => {
      spinner.clear();
      spinner.stop();

      logger.info(
        '构建完成，' +
          `耗时 ${printer.blue(getShortTime(Date.now() - timer))}，` +
          `文件 ${printer.yellow(`${assets.length} 个`)}，` +
          `总大小 ${printer.green(getShortSize(getSize(assets)))}`,
      );
    });

    builder.hooks.failed.tap(pluginName, (errors) => {
      spinner.stop();
      spinner.clear();

      logger.info(`构建失败，发现了 ${printer.bold(errors.length)} 个错误：`);

      for (const err of errors) {
        logger.error(`${err.toString()}\n`);
      }
    });
  },
});
