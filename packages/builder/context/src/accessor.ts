import type { FileAccessor } from '@blog/types';
import { GlobalKey } from './types';

export const Memory = new Map<string, any>();

/** 文件访问器 */
export function getFileAccessor(path: string, content: Buffer): FileAccessor {
  const cacheKey = `file::${path}`;

  Memory.set(cacheKey, content);

  return {
    get() {
      return content;
    },
    getCode() {
      return `
      export default {
        path,
        content: globalThis[${GlobalKey.Memory}].get(${JSON.stringify(cacheKey)}),
      };
      `;
    },
  };
}
