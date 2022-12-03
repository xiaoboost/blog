import { RunnerInstance, BuilderInstance, AssetData } from '@blog/types';
import { getContext } from '@blog/context';
import { runScript, RunError } from '@xiao-ai/utils/node';

export class Runner implements RunnerInstance {
  private _builder: BuilderInstance;

  private _code = '';

  private _assets: AssetData[] = [];

  private _error: RunError | undefined;

  constructor(builder: BuilderInstance) {
    this._builder = builder;
    this.init('');
  }

  private init(code?: string) {
    this._code = code ?? '';
    this._assets = [];
    this._error = undefined;
  }

  private getContext() {
    const runtimeConsole: Console = {
      ...console,
      log(...args: any[]) {
        console.log('[Runtime]', ...args);
      },
    };

    return {
      ...getContext(this._builder),
      process,
      Buffer,
      setTimeout,
      setImmediate,
      setInterval,
      clearImmediate,
      clearInterval,
      clearTimeout,
      console: runtimeConsole,
    };
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
      globalParams: this.getContext(),
    });

    debugger;
    this._error = result.error;
    this._assets = await result.output();
  }
}
