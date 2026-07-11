import type { BuilderInstance, BuildHook } from '@blog/types';
import { GlobalKey } from './types';

const Memory = new Map<string, any>();

/** 初始化全局上下文 */
export function initGlobalContext(builder: BuilderInstance, hookCallbacks: BuildHook[]) {
  return {
    [GlobalKey.Memory]: Memory,
    [GlobalKey.Builder]: builder,
    [GlobalKey.RuntimeCallbacks]: hookCallbacks,
  };
}
