import type { TemplateUtils, RuntimeHooks } from '@blog/types';
import { unique } from '@xiao-ai/utils';
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
  const val = unique(assets.slice());

  return {
    addAssetNames: (...assets: string[]) => val.push(...assets),
    getAssetNames: () => {
      return process.env.NODE_ENV === 'production'
        ? val.filter((item) => !item.endsWith('.map'))
        : val.slice();
    },
    getScriptNames: () => val.filter((item) => item.endsWith('.js')),
    getStyleNames: () => val.filter((item) => item.endsWith('.css')),
  };
}
