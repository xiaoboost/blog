import { BuilderInstance, BuilderPlugin, RunnerHooks } from '@blog/types';

const BuilderKey = '_Builder';

const HookKey = '_HookKey';

export type InjectRunnerHooks = {
  [key in keyof RunnerHooks]: () => Promise<void>;
};

/** 虚拟 builder 变量 */
declare const _Builder: BuilderInstance;

/** 虚拟 hook 变量 */
declare const _HookKey: InjectRunnerHooks;

/** 构建器上下文 */
export function getBuilderContext(builder: BuilderInstance, hook: InjectRunnerHooks) {
  return {
    [HookKey]: hook,
    [BuilderKey]: builder,
  };
}

/** 运行时钩子函数 */
export const runnerHook = _HookKey;

/** 注册插件 */
export function definePlugin(plugin: BuilderPlugin): void {
  plugin.apply(_Builder);
}
