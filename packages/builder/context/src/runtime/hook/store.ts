import type {
  RuntimeHooks,
  RuntimeData,
  PostUrlMap,
  AssetData,
  PostExportData,
  ListRenderData,
} from '@blog/types';
import { AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable';
import { getAccessor } from '../accessor';

export const hooks: RuntimeHooks = {
  beforeStart: new AsyncSeriesHook<[]>(),
  afterPostUrl: new AsyncSeriesHook<[PostUrlMap]>(['PostUrlMap']),
  beforeEachPost: new AsyncSeriesHook<[PostExportData]>(['PostExportData']),
  afterEachPost: new AsyncSeriesHook<[AssetData]>(['Asset']),
  beforeEachList: new AsyncSeriesHook<[ListRenderData]>(['ListRenderData']),
  afterEachList: new AsyncSeriesHook<[AssetData]>(['Asset']),
  processAssets: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
  afterBuild: new AsyncSeriesHook<[AssetData[]]>(['Assets']),
};

export type EachSetupHook = (runtime: RuntimeData) => void;
export type OnceSetupHook = (runtime: RuntimeData) => void;

export const forEachStack: EachSetupHook[] = [];
export const forOnceStack: OnceSetupHook[] = [];

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
  const runtimeData: RuntimeData = {
    hooks,
  };

  if (isFirstRun.get()) {
    forOnceStack.forEach((item) => item(runtimeData));
  }

  forEachStack.forEach((item) => item(runtimeData));

  // 初始化完成
  readySwitch();
});
