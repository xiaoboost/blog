import { join } from 'path';
import { RunnerInstance, RunnerHooks, BuilderInstance, PostUrlMap } from '@blog/types';
import { AsyncSeriesHook } from 'tapable';

export class Runner implements RunnerInstance {
  private builder: BuilderInstance;

  private _code = '';

  hooks: RunnerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      beforeStart: new AsyncSeriesHook<[]>(),
      beforeComponent: new AsyncSeriesHook<[]>(),
      afterComponent: new AsyncSeriesHook<[]>(),
      afterPostUrl: new AsyncSeriesHook<[PostUrlMap]>(['PostUrlMap']),
      beforeEachPost: new AsyncSeriesHook<[]>(),
      afterEachPost: new AsyncSeriesHook<[]>(),
    };
  }

  run(code: string): Promise<void> {
    return Promise.resolve();
  }
}
