import { Accessor, FileAccessor } from './types';

export const Memory = new Map<string, any>();

/** 全局缓存变量名称 */
export const MemoryKey = '_Memory';

/** 全局访问器 */
export function getAccessor<T = any>(name: string): Accessor<T> {
  return {
    get() {
      return Memory.get(name);
    },
    set(val) {
      Memory.set(name, val);
    },
  };
}

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
        content: ${MemoryKey}.get(${JSON.stringify(cacheKey)}),
      };
      `;
    },
  };
}
