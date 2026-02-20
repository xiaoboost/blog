import type {
  RuntimeHooks,
  RuntimeData,
  AssetData,
  PostExportData,
  PostListData,
  UrlListData,
  PostBasicData,
  PostListDataWithTitle,
} from '@blog/types';
import { AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable';
import { getAccessor } from '../accessor';

export const hooks: RuntimeHooks = {
  beforeStart: new AsyncSeriesHook<[]>(),
  afterPostDataReady: new AsyncSeriesHook<[PostBasicData[]]>(['PostData']),
  beforePreBuild: new AsyncSeriesHook<[]>(),
  afterPreBuild: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
  beforeEachPost: new AsyncSeriesHook<[PostExportData, number, PostExportData[]]>([
    'PostExportData',
    'Index',
    'AllPostExportData',
  ]),
  afterEachPost: new AsyncSeriesHook<[AssetData, number, PostExportData[]]>([
    'Asset',
    'Index',
    'AllPostExportData',
  ]),
  beforeEachMainIndexList: new AsyncSeriesHook<[PostListData]>(['PostListData']),
  afterEachMainIndexList: new AsyncSeriesHook<[AssetData]>(['Asset']),
  beforeEachTagList: new AsyncSeriesHook<[UrlListData]>(['UrlList']),
  afterEachTagList: new AsyncSeriesHook<[AssetData]>(['Asset']),
  beforeEachTagPostList: new AsyncSeriesHook<[PostListDataWithTitle]>(['PostListData']),
  afterEachTagPostList: new AsyncSeriesHook<[AssetData]>(['Asset']),
  beforeEachYearList: new AsyncSeriesHook<[UrlListData]>(['UrlList']),
  afterEachYearList: new AsyncSeriesHook<[AssetData]>(['Asset']),
  beforeEachYearPostList: new AsyncSeriesHook<[PostListDataWithTitle]>(['PostListData']),
  afterEachYearPostList: new AsyncSeriesHook<[AssetData]>(['Asset']),
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
