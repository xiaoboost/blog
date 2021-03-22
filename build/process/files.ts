import * as path from 'path';
import * as fs from 'fs';
import * as mfs from 'memfs';

import { isDevelopment, mkdirp } from '../utils';
import { site } from '../config/website';
import { outputDir } from '../config/project';

export interface FileData {
  path: string;
  contents: Uint8Array | Buffer | string;
}

const data: FileData[] = [];
const cname: FileData = {
  path: path.join(outputDir, 'CNAME'),
  contents: site.cname,
};

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

  for (const file of data.concat(cname)) {
    const dirname = path.dirname(file.path);

    if (!dirMap[dirname]) {
      await mkdirp(dirname, dirMap, vfs);
    }

    await vfs.writeFile(file.path, file.contents);
  }
}

export function find(cb: (file: FileData) => boolean) {
  return data.find(cb);
}
