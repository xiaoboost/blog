import type { Accessor, AccessorGetter } from '@blog/types';
import type { Memory } from '../types';
import { GlobalKey } from '../types';

/** 缓存访问器 */
export function getAccessor<T = any>(name: string): Accessor<T | undefined>;
export function getAccessor<T = any>(name: string, defaultValue: T): Accessor<T>;
export function getAccessor<T = any>(name: string, defaultValue?: T): Accessor<T> {
  const key = `var::${name}`;

  return {
    get() {
      return globalThis[GlobalKey.Memory].get(key) ?? defaultValue;
    },
    set(val: T) {
      globalThis[GlobalKey.Memory].set(key, val);
    },
  };
}

/** 附带读取器的缓存访问器 */
export function getAccessorWithGetter<T = any>(name: string, getter: () => T): AccessorGetter<T> {
  const key = `getter::${name}`;

  return {
    get() {
      const memory = globalThis[GlobalKey.Memory] as Memory;
      const hasCache = memory.has(key);
      const content = hasCache ? memory.get(key) : getter();

      if (!hasCache) {
        memory.set(key, content);
      }

      return content;
    },
  };
}
