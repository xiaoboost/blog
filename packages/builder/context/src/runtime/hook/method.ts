import type { RuntimeHooks } from '@blog/types';
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

/** 替换资源 */
export function replaceAsset(assets: string[], oldAsset: string, newAsset: string): void {
  const index = assets.indexOf(oldAsset);
  if (index !== -1) {
    assets[index] = newAsset;
  }
}

/** 插入资源 */
export function insertAsset(assets: string[], index: number, asset: string): void {
  assets.splice(index, 0, asset);
}
