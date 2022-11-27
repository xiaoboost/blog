import { RunnerInstance, RunnerHooks, BuilderInstance, PostUrlMap } from '@blog/types';
import { getContext, InjectRunnerHooks, AssetData } from '@blog/context';
import { AsyncSeriesHook } from 'tapable';
import { runScript, RunError } from '@xiao-ai/utils/node';

export class Runner implements RunnerInstance {
  private _builder: BuilderInstance;

  private _code = '';

  private _assets: AssetData[] = [];

  private _error: RunError | undefined;

  hooks!: RunnerHooks;

  constructor(builder: BuilderInstance) {
    this._builder = builder;
    this.init('');
  }

  private init(code?: string) {
    this._code = code ?? '';
    this._assets = [];
    this._error = undefined;
    this.hooks = {
      beforeStart: new AsyncSeriesHook<[]>(),
      beforeComponent: new AsyncSeriesHook<[]>(),
      afterComponent: new AsyncSeriesHook<[]>(),
      afterPostUrl: new AsyncSeriesHook<[PostUrlMap]>(['PostUrlMap']),
      beforeEachPost: new AsyncSeriesHook<[]>(),
      afterEachPost: new AsyncSeriesHook<[]>(),
    };
  }

  private getContext() {
    const wrapHook = Object.keys(this.hooks).reduce((ans, item) => {
      ans[item] = () => this.hooks[item].promise();
      return ans;
    }, {} as InjectRunnerHooks);

    return getContext(this._builder, wrapHook);
  }

  getResult() {
    return {
      assets: this._assets.slice(),
      error: this._error,
    };
  }

  async run(code: string): Promise<void> {
    this.init(code);

    const result = runScript<() => Promise<AssetData[]>>(this._code, {
      dirname: __dirname,
      globalParams: {
        ...this.getContext(),
        process,
        Buffer,
      },
    });

    this._error = result.error;
    this._assets = await result.output();
  }
}
