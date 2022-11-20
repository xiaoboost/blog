import type {
  OnLoadOptions as HookOptions,
  OnLoadArgs,
  OnResolveArgs,
  OnLoadResult,
  OnResolveResult,
} from 'esbuild';

type OnResolveHook = (args: OnResolveArgs) => OnResolveResult | null | undefined;
type OnResolveAsyncHook = (args: OnResolveArgs) => Promise<OnResolveResult | null | undefined>;
type OnLoadHook = (args: OnLoadArgs) => OnLoadResult | null | undefined;
type OnLoadAsyncHook = (args: OnLoadArgs) => Promise<OnLoadResult | null | undefined>;

export function wrap(options: HookOptions, hook: OnResolveHook): OnResolveHook;
export function wrap(options: HookOptions, hook: OnLoadHook): OnLoadHook;
export function wrap(options: HookOptions, hook: OnResolveAsyncHook): OnResolveAsyncHook;
export function wrap(options: HookOptions, hook: OnLoadAsyncHook): OnLoadAsyncHook;
export function wrap(
  options: HookOptions,
  hook: OnResolveHook | OnLoadHook | OnResolveAsyncHook | OnLoadAsyncHook,
): OnResolveHook | OnLoadHook | OnResolveAsyncHook | OnLoadAsyncHook {
  return ((args: OnLoadArgs | OnResolveArgs) => {
    if (options.namespace) {
      if (args.namespace === options.namespace) {
        return hook(args as any);
      } else {
        return null;
      }
    }

    if (options.filter.test(args.path)) {
      return hook(args as any);
    }
  }) as any;
}
