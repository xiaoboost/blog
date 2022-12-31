import type { TemplateUtils, RuntimeHooks } from '@blog/types';
import { hooks } from './store';

type GetAsyncHookParameter<T extends keyof RuntimeHooks> = Parameters<
  Parameters<RuntimeHooks[T]['tapPromise']>[1]
>;

/** 调用钩子 */
export function callHook<T extends keyof RuntimeHooks>(
  name: T,
  ...args: GetAsyncHookParameter<T>
): Promise<void> {
  return (hooks[name].promise as any)(...args);
}

/** 定义工具函数 */
export function defineUtils(data?: Partial<TemplateUtils>): TemplateUtils {
  return {
    getAssetNames: data?.getAssetNames ?? (() => []),
    createAssets: data?.createAssets ?? (() => Promise.resolve([])),
  };
}
