import * as path from 'path';
import * as fs from 'fs';
import * as mfs from 'memfs';

import { isDevelopment } from '../utils';

export interface FileData {
  path: string;
  contents: Uint8Array | Buffer | string;
}

const data: FileData[] = [];

export async function mkdirp(target: string, map: Record<string, boolean>) {
  const vfs = isDevelopment ? mfs.fs.promises : fs.promises;

  // 待创建的路径
  const dirs: string[] = [];
  const exist = (target: string) => {
    return vfs.stat(target)
      .then((data: any) => Boolean(data))
      .catch(() => false);
  };

  let dir = target;

  while (!(await exist(dir))) {
    dirs.push(dir);
    dir = path.dirname(dir);
  }

  while (dirs.length > 0) {
    const dir = dirs.pop()!;

    if (map[dir]) {
      return;
    }

    map[dir] = true;
    await vfs.mkdir(dir);
  }
}

export function clear() {
  data.length = 0;
}

export function push(...files: FileData[]) {
  for (const file of files) {
    const index = data.findIndex(({ path }) => path === file.path);

    if (index > -1) {
      data.splice(index, 1, file);
    }
    else {
      data.push(file);
    }
  }
}

export async function write() {
  const dirMap: Record<string, boolean> = {};
  const vfs = isDevelopment ? mfs.fs.promises : fs.promises;

  for (const file of data) {
    const dirname = path.dirname(file.path);

    if (!dirMap[dirname]) {
      await mkdirp(dirname, dirMap);
    }

    await vfs.writeFile(file.path, file.contents);
  }
}

export function find(cb: (file: FileData) => boolean) {
  return data.find(cb);
}
