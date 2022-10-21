import { BuilderHooks, BuilderInstance, BuilderOptions } from '@blog/types';
import { AsyncSeriesHook, AsyncParallelHook } from 'tapable';
import { applyPlugin } from './plugin';
import { Bundler } from '../bundler';

export class Builder implements BuilderInstance {
  static async create(opt: BuilderOptions) {
    debugger;
    const builder = new Builder(opt);
    await builder.init();
    return builder;
  }

  options: Required<BuilderOptions>;

  hooks: BuilderHooks;

  root: string;

  private bundler: Bundler;

  constructor(opt: BuilderOptions) {
    this.root = process.cwd();
    this.bundler = new Bundler(this);
    this.options = {
      outDir: opt.outDir ?? 'dist',
      mode: opt.mode === 'production' ? 'production' : 'development',
      hmr: opt.hmr ?? false,
    };
    this.hooks = {
      initialization: new AsyncSeriesHook<[Required<BuilderOptions>]>(['options']),
      endBuild: new AsyncSeriesHook<[]>(),
      done: new AsyncSeriesHook<[]>(),
      fail: new AsyncSeriesHook<[Error[]]>(['errors']),
      filesChange: new AsyncParallelHook<string[]>(['files']),
      bundler: new AsyncSeriesHook<[Bundler]>(['bundler']),
      runner: new AsyncSeriesHook<[]>([]),
      afterBundle: new AsyncSeriesHook<[string]>(['code']),
    };
  }

  private async _build() {
    try {
      await this.hooks.bundler.promise(this.bundler);
    } catch (e: any) {
      console.log(e);
    }
  }

  async init() {
    applyPlugin(this);
    await this.hooks.initialization.promise({ ...this.options });
  }

  watch() {
    return Promise.resolve({
      stop: () => void 0,
    });
  }

  build() {
    return this._build();
  }
}
