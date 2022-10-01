import { BuildOptions, OnResolveArgs, ResolveResult, OnLoadArgs, OnLoadResult } from 'esbuild';
import { BundleResult, BundlerHooks, BundlerInstance, BuilderHooks } from '@blog/types';
import { AsyncSeriesBailHook, SyncHook } from 'tapable';

export class Bundler implements BundlerInstance {
  builder: BuilderHooks;

  hooks: BundlerHooks;

  constructor(builder: BuilderHooks) {
    this.builder = builder;
    this.hooks = {
      configuration: new SyncHook<[], BuildOptions | undefined>(),
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], ResolveResult | undefined>(['resolveArgs']),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined>(['loadArgs']),
    };
  }

  bundle(): Promise<BundleResult> {
    return {} as Promise<BundleResult>;
  }
}
