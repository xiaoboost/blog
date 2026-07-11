import type {
  AssetData,
  BuildContext,
  BuildContextWithPage,
  BuildHook,
  InitHook,
  PostBasicData,
  RuntimeData,
  RuntimeHooks,
} from '@blog/types';
import { AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable';
import { GlobalKey } from '../../types';
import { getAccessor } from '../accessor';
import { getGlobalContext } from '../constant';

export const hooks: RuntimeHooks = {
  beforeStart: new AsyncSeriesHook<[]>(),
  afterPostDataReady: new AsyncSeriesHook<[PostBasicData[]]>(['PostData']),
  afterReady: new AsyncSeriesHook<[BuildContext]>(['BuildContext']),
  beforeBuild: new AsyncSeriesHook<[BuildContext]>(['BuildContext']),
  beforePageRender: new AsyncSeriesHook<[BuildContextWithPage]>(['BuildContextWithPage']),
  afterPageRender: new AsyncSeriesHook<[BuildContextWithPage]>(['BuildContextWithPage']),
  processAssets: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
  afterBuild: new AsyncSeriesHook<[AssetData[]]>(['Assets']),
};

export { BuildHook, InitHook };

export const buildStack: BuildHook[] = [];
export const initStack: InitHook[] = [];

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
  const builderHooks = getGlobalContext()[GlobalKey.RuntimeCallbacks] ?? [];
  const runtimeData: RuntimeData = {
    hooks,
  };

  if (isFirstRun.get()) {
    initStack.forEach((item) => item(runtimeData));
  }

  buildStack.forEach((item) => item(runtimeData));
  builderHooks.forEach((item) => item(runtimeData));

  // 初始化完成
  readySwitch();
});
