import * as path from 'path';

import packageData from '../package.json';

export function resolve(...paths: string[]) {
  return path.join(__dirname, '..', ...paths);
}

export const inputDir = resolve('data');
export const outDir = resolve(packageData.main);
