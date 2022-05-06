import * as fs from 'fs/promises';

import { FileCache } from '../utils';

const fsCache = new Map<string, Buffer>();

export const CacheVarName = 'fsm';

export const cache: FileCache = {
  readFile: async (target: string) => {
    if (fsCache.has(target)) {
      return fsCache.get(target);
    }

    const content = (await fs.readFile(target, 'binary')) as unknown as Buffer;
    debugger;
    fsCache.set(target, content);
    return content;
  },
  writeFile(target: string, content: Buffer) {
    fsCache.set(target, content);
  },
};
