import type { Accessor, AccessorGetter } from '@blog/types';
import { isDef } from '@xiao-ai/utils';
import type { Memory } from '../types';
import { getGlobalContext, GlobalKey } from './constant';

/** 缓存访问器 */
export function getAccessor<T = any>(name: string): Accessor<T | undefined>;
export function getAccessor<T = any>(name: string, defaultValue: T): Accessor<T>;
export function getAccessor<T = any>(name: string, defaultValue?: T): Accessor<T> {
  const key = `var::${name}`;
  const memory = getGlobalContext()[GlobalKey.Memory] as Memory;

  if (memory && !memory.has(key) && isDef(defaultValue)) {
    memory.set(key, defaultValue);
  }

  return {
    get() {
      return memory?.get?.(key);
    },
    set(val: T) {
      memory?.set?.(key, val);
    },
  };
}

/** 附带读取器的缓存访问器 */
export function getAccessorWithGetter<T = any>(name: string, getter: () => T): AccessorGetter<T> {
  const key = `getter::${name}`;
  const memory = getGlobalContext()[GlobalKey.Memory] as Memory;

  if (memory && !memory.has(key)) {
    memory.set(key, getter());
  }

  return {
    get() {
      return memory?.get?.(key);
    },
  };
}

/** 变量引用 */
export function getReference<T = any>(name: string, initVal: T) {
  const key = `ref::${name}`;
  const memory = getGlobalContext()[GlobalKey.Memory] as Memory;

  if (memory && !memory.has(key) && isDef(initVal)) {
    memory.set(key, initVal);
  }

  return initVal;
}
