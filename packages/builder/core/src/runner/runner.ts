import { RunnerInstance, BuilderInstance, AssetData, BundlerResult, ErrorData } from '@blog/types';
import { getContext } from '@blog/context';
import { Instance } from 'chalk';
import { runScript, RunError } from '@xiao-ai/utils/node';
import { Logger, getOriginCodeFrame } from '../utils';

export class Runner implements RunnerInstance {
  private builder: BuilderInstance;

  private code = '';

  private sourceMap = '';

  private output: any;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.init('');
  }

  private init(code?: string, sourceMap?: string) {
    this.code = code ?? '';
    this.sourceMap = sourceMap ?? '';
    this.output = undefined;
  }

  private getContext() {
    const { terminalColor: color, logLevel } = this.builder.options;
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
      console: new Logger(logLevel, printer, printer.blue('[Runtime]')),
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
        column: location.column ?? 1,
      },
      end: {
        line: location.line,
        column: (location.column ?? 1) + (location.length ?? 0),
      },
    };
    const codeFrame = await getOriginCodeFrame(range, sourceMap);
    const data: ErrorData = {
      message,
      name,
      project: builder.name,
      filePath: codeFrame?.path,
      codeFrame,
    };

    return data;
  }

  getOutput() {
    return this.output;
  }

  async run({ source, sourceMap }: BundlerResult): Promise<void> {
    this.init(source, sourceMap);

    const result = runScript<() => Promise<AssetData[]>>(this.code, {
      dirname: __dirname,
      globalParams: this.getContext(),
    });

    if (result.output) {
      this.output = result.output;
    }

    if (result.error) {
      throw await this.parseError(result.error);
    }
  }
}
