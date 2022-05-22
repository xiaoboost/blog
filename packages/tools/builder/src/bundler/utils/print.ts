import type { Message } from 'esbuild';

import Chalk from 'chalk';

import { codeFrameColumns } from '@babel/code-frame';
import { BuildError } from './types';

export function getSize(assets: AssetData[]) {
  return assets.reduce((ans, item) => ans + Buffer.from(item.content).byteLength, 0);
}

function getShortString(current: number, unit: string) {
  if (current > 100) {
    return `${current} ${unit}`;
  } else if (current > 10) {
    return `${Number(current.toFixed(1))} ${unit}`;
  } else {
    return `${Number(current.toFixed(2))} ${unit}`;
  }
}

export function getShortSize(size: number) {
  const units = ['B', 'kB', 'MB', 'GB'];

  let current = size;
  let rank = 0;

  while (current > 1024) {
    current = current / 1024;
    rank++;
  }

  return getShortString(current, units[rank]);
}

export function getShortTime(time: number) {
  const units = ['毫秒', '秒', '分钟', '小时'];
  const ranks = [1000, 60, 60, Infinity];

  let current = time;
  let level = 0;

  while (current > ranks[level]) {
    current = current / ranks[level];
    level++;
  }

  return getShortString(current, units[level]);
}

export function printEsbuildError(errors: Message[]) {
  for (const err of errors) {
    const data = err.detail as BuildError;

    if (data) {
      const codeFrame = codeFrameColumns(data.content, data.position, {
        highlightCode: true,
      });

      console.log(
        `${Chalk.bgRed('File')}: ${data.file}\n` +
          `${Chalk.bgBlue('Reason')}: ${Chalk.red(data.message)}` +
          `\n\n${codeFrame}\n`,
      );
    } else {
      console.log(
        `${Chalk.bgRed('File')}: ${err.location!.file}\n` +
          `${Chalk.bgRed('Reason')}: ${Chalk.red(err.text)}\n\n` +
          `  ${err.location!.lineText}\n`,
      );
    }
  }
}
