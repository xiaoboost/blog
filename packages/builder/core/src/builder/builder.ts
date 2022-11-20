import { BuilderHooks, BuilderInstance, CommandOptions, BuilderOptions } from '@blog/types';
import { AsyncSeriesHook, AsyncParallelHook } from 'tapable';
import { applyPlugin, normalizeOptions } from './options';
import { Bundler } from '../bundler';
import { Runner } from '../runner';

export class Builder implements BuilderInstance {
  static async create(opt: CommandOptions) {
    const builder = new Builder(opt);
    await builder.init();
    return builder;
  }

  private bundler: Bundler;

  private runner: Runner;

  root: string;

  hooks: BuilderHooks;

  options: Required<BuilderOptions>;

  constructor(opt: CommandOptions) {
    this.root = process.cwd();
    this.bundler = new Bundler(this);
    this.runner = new Runner(this);
    this.options = normalizeOptions(opt);
    this.hooks = {
      initialization: new AsyncSeriesHook<[Required<BuilderOptions>]>(['options']),
      endBuild: new AsyncSeriesHook<[]>(),
      done: new AsyncSeriesHook<[]>(),
      fail: new AsyncSeriesHook<[Error[]]>(['errors']),
      filesChange: new AsyncParallelHook<string[]>(['files']),
      bundler: new AsyncSeriesHook<[Bundler]>(['Bundler']),
      runner: new AsyncSeriesHook<[Runner]>(['Runner']),
    };
  }

  async init() {
    applyPlugin(this);
    await this.hooks.initialization.promise({ ...this.options });
  }

  async stop() {
    await this.bundler.dispose();
    await this.hooks.done.promise();
  }

  async watch() {
    this.options.isWatch = true;
    await this.build();
  }

  async build() {
    try {
      await this.hooks.bundler.promise(this.bundler);
      await this.bundler.bundle();
      await this.hooks.runner.promise(this.runner);
      await this.runner.run(this.bundler.getBundledCode());
    } catch (e: any) {
      debugger;
      console.log(e);
    }
  }
}
