import type { RuntimeHooks, RuntimeData, PostUrlMap, BuilderInstance } from '@blog/types';
import { AsyncSeriesHook } from 'tapable';
import { getAccessor } from '../accessor';
import { GlobalKey } from '../../types';

export const hooks: RuntimeHooks = {
  beforeStart: new AsyncSeriesHook<[]>(),
  beforeComponent: new AsyncSeriesHook<[]>(),
  afterComponent: new AsyncSeriesHook<[]>(),
  afterPostUrl: new AsyncSeriesHook<[PostUrlMap]>(['PostUrlMap']),
  beforeEachPost: new AsyncSeriesHook<[]>(),
  afterEachPost: new AsyncSeriesHook<[]>(),
};

export type SetupHook = (runtime: RuntimeData, builder: BuilderInstance) => void;

export const forEachStack: SetupHook[] = [];
export const forOnceStack: SetupHook[] = [];

/** 是否是首次运行 */
export const isFirstRun = getAccessor<boolean>('isFirstRun', true);

/**
 * 初始化开关
 *   - 运行函数后`waitReady`状态将会变为`fulfilled`
 */
export let readySwitch: () => void = () => void 0;

/** 等待初始化 */
export const waitReady = new Promise<void>((resolve) => {
  readySwitch = () => {
    isFirstRun.set(false);
    resolve();
  };
});

// 延迟运行钩子
setTimeout(() => {
  const builder: BuilderInstance = globalThis[GlobalKey.Builder];
  const runtimeData: RuntimeData = {
    hooks,
  };

  if (isFirstRun.get()) {
    forOnceStack.forEach((item) => item(runtimeData, builder));
  }

  forEachStack.forEach((item) => item(runtimeData, builder));

  // 初始化完成
  readySwitch();
});
