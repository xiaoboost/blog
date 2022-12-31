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
export function defineUtils(assets: string[] = []): TemplateUtils {
  return {
    getAssetNames: () => {
      return process.env.NODE_ENV === 'production'
        ? assets.filter((item) => !item.endsWith('.map'))
        : assets.slice();
    },
    getScriptNames: () => assets.filter((item) => item.endsWith('.js')),
    getStyleNames: () => assets.filter((item) => item.endsWith('.css')),
  };
}
