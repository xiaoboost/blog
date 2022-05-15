import * as fs from 'fs/promises';

import { FileCache } from '../utils';

const fsCache = new Map<string, Buffer>();

export const fileCache: FileCache = {
  readFile: async (target: string) => {
    if (fsCache.has(target)) {
      return fsCache.get(target);
    }

    const content = await fs.readFile(target);
    fsCache.set(target, content);
    return content;
  },
  writeFile(target: string, content: Buffer) {
    fsCache.set(target, content);
  },
};
