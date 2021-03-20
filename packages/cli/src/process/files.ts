import * as path from 'path';
import * as fs from 'fs-extra';

export interface FileData {
  path: string;
  contents: Uint8Array | Buffer | string;
}

const data: FileData[] = [];

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
  debugger;
  const dirMap: Record<string, boolean> = {};

  for (const file of data) {
    const dirname = path.dirname(file.path);

    if (!dirMap[dirname]) {
      await fs.mkdirp(dirname);
      dirMap[dirname] = true;
    }

    await fs.writeFile(file.path, file.contents);
  }
}
