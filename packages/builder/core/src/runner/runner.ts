import { resolve } from 'path';
import { initGlobalContext } from '@blog/context';
import {
  type RunnerInstance,
  type BuilderInstance,
  type BundlerResult,
  type ErrorData,
  type RunnerCb, type BuildHook,
} from '@blog/types';
import { type RunError, runScript } from '@xiao-ai/utils/node';
import { Instance } from 'chalk';
import { Logger, getOriginCodeFrame } from '../utils';
import { prepareDebugScript } from './debug';

let nextRunnerId = 1;

export class Runner implements RunnerInstance {
  private readonly debugId = nextRunnerId++;

  private builder: BuilderInstance;

  private sourceMap = '';

  private output!: RunnerCb;

  private hookCallbacks: BuildHook[] = [];

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.init();
  }

  private init(sourceMap?: string) {
    this.sourceMap = sourceMap ?? '';
    this.output = () => Promise.resolve([]);
  }

  private getContext() {
    const { terminalColor: color, logLevel } = this.builder.options;
    const printer = new Instance({ level: color ? 3 : 0 });

    return {
      ...initGlobalContext(this.builder, this.hookCallbacks),
      process,
      Buffer,
      setTimeout,
      setImmediate,
      setInterval,
      clearImmediate,
      clearInterval,
      clearTimeout,
      fetch,
      global,
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

  async run(result: BundlerResult): Promise<void> {
    const { source, sourceMap } = result;
    this.init(sourceMap);

    let code = source;
    try {
      code = await prepareDebugScript(
        result,
        resolve(this.builder.root, this.builder.options.cache),
        this.debugId,
      );
    }
    catch (err) {
      // 调试附件不可用时仍执行原脚本，不影响博客构建。
      const message = err instanceof Error ? err.message : String(err);
      this.builder.logger.error(`[Source Map] 无法准备调试映射：${message}`);
    }

    const execution = runScript<RunnerCb>(code, {
      dirname: __dirname,
      globalParams: this.getContext(),
    });

    if (execution.output) {
      this.output = execution.output;
    }

    if (execution.error) {
      throw await this.parseError(execution.error);
    }
  }

  registerHook(callback: BuildHook): void {
    this.hookCallbacks.push(callback);
  }
}
