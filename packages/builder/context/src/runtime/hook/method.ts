import type { TemplateUtils, RuntimeHooks } from '@blog/types';
import { unique } from '@xiao-ai/utils';
import { hooks } from './store';

type GetAsyncHookParameter<T extends keyof RuntimeHooks> = Parameters<
  Parameters<RuntimeHooks[T]['tapPromise']>[1]
>;

type GetAsyncHookReturnType<T extends keyof RuntimeHooks> = ReturnType<
  Parameters<RuntimeHooks[T]['tapPromise']>[1]
>;

/** 调用钩子 */
export function callHook<T extends keyof RuntimeHooks>(
  name: T,
  ...args: GetAsyncHookParameter<T>
): GetAsyncHookReturnType<T> {
  return (hooks[name].promise as any)(...args);
}

/** 定义工具函数 */
export function defineUtils(assets: string[] = []): TemplateUtils {
  const getAssetNames = () => {
    const val = unique(assets.slice());
    return process.env.NODE_ENV === 'production'
      ? val.filter((item) => !item.endsWith('.map'))
      : val.slice();
  };

  return {
    addAssetNames: (...newAssets: string[]) => assets.push(...newAssets),
    getAssetNames,
    getScriptNames: () => getAssetNames().filter((item) => item.endsWith('.js')),
    getStyleNames: () => getAssetNames().filter((item) => item.endsWith('.css')),
  };
}

/** 替换资源 */
export function replaceAsset(assets: string[], oldAsset: string, newAsset: string): void {
  const index = assets.indexOf(oldAsset);
  if (index !== -1) {
    assets[index] = newAsset;
  }
}
