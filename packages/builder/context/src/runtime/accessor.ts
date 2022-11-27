import type { Accessor } from '@blog/types';
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
