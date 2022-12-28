import { RunnerInstance, BuilderInstance, AssetData, BundlerResult, ErrorData } from '@blog/types';
import { getContext } from '@blog/context';
import { Instance } from 'chalk';
import { isFunc } from '@xiao-ai/utils';
import { runScript, RunError } from '@xiao-ai/utils/node';
import { getPrefixConsole, getOriginCodeFrame } from '../utils';

export class Runner implements RunnerInstance {
  private builder: BuilderInstance;

  private code = '';

  private sourceMap = '';

  private assets: AssetData[] = [];

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.init('');
  }

  private init(code?: string, sourceMap?: string) {
    this.code = code ?? '';
    this.sourceMap = sourceMap ?? '';
    this.assets = [];
  }

  private getContext() {
    const { terminalColor: color } = this.builder.options;
    const printer = new Instance({ level: color ? 3 : 0 });

    return {
      ...getContext(this.builder),
      process,
      Buffer,
      setTimeout,
      setImmediate,
      setInterval,
      clearImmediate,
      clearInterval,
      clearTimeout,
      console: getPrefixConsole(printer.blue('[Runtime]')),
    };
  }

  private async parseError(err: RunError): Promise<Error> {
    if (!err.location) {
      return err;
    }

    const { location, name, message } = err;
    const { builder, sourceMap } = this;
    const range = {
      start: {
        line: location.line,
        column: location.column ?? 0,
      },
      end: {
        line: location.line,
        column: (location.column ?? 0) + (location.length ?? 0),
      },
    };
    const data: ErrorData = {
      message,
      name,
      project: builder.name,
      codeFrame: await getOriginCodeFrame(range, sourceMap),
    };

    return data;
  }

  getAssets() {
    return this.assets.slice();
  }

  async run({ source, sourceMap }: BundlerResult): Promise<void> {
    this.init(source, sourceMap);

    const result = runScript<() => Promise<AssetData[]>>(this.code, {
      dirname: __dirname,
      globalParams: this.getContext(),
    });

    if (isFunc(result.output)) {
      this.assets = (await result.output()) ?? [];
    }

    if (result.error) {
      throw await this.parseError(result.error);
    }
  }
}
