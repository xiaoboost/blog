import { RunnerInstance, BuilderInstance, AssetData, BundlerResult, ErrorData } from '@blog/types';
import { getContext } from '@blog/context';
import { lookItUp } from 'look-it-up';
import { isAbsolute, relative } from 'path';
import { readFile } from 'fs/promises';
import { SourceMapConsumer } from 'source-map';
import { isFunc } from '@xiao-ai/utils';
import { runScript, RunError } from '@xiao-ai/utils/node';
import { getPrefixConsole } from '../utils';

export class Runner implements RunnerInstance {
  private _builder: BuilderInstance;

  private _code = '';

  private _sourceMap = '';

  private _assets: AssetData[] = [];

  private _error: Error | undefined;

  constructor(builder: BuilderInstance) {
    this._builder = builder;
    this.init('');
  }

  private init(code?: string, sourceMap?: string) {
    this._code = code ?? '';
    this._sourceMap = sourceMap ?? '';
    this._assets = [];
    this._error = undefined;
  }

  private getContext() {
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
      console: getPrefixConsole('[Runtime]'),
    };
  }

  private async parseError(err: RunError): Promise<Error> {
    if (!err.location) {
      return err;
    }

    const sourceMap = await new SourceMapConsumer(this._sourceMap);
    const { location: transformLoc, name, message } = err;
    const originLoc = sourceMap.originalPositionFor({
      line: transformLoc.line,
      column: transformLoc.column ?? 0,
    });

    if (!originLoc.line || !originLoc.source) {
      return err;
    }

    const filePath = await (async () => {
      if (!originLoc.source || isAbsolute(originLoc.source)) {
        return transformLoc.filePath;
      }

      const search = await lookItUp(originLoc.source!, __dirname);

      if (search) {
        return search;
      }

      return transformLoc.filePath;
    })();
    const fileContent =
      originLoc.source && sourceMap.sourceContentFor(originLoc.source)
        ? sourceMap.sourceContentFor(originLoc.source)!
        : await readFile(filePath, 'utf-8');

    const data: ErrorData = {
      message,
      name,
      codeFrame: {
        path: relative(this._builder.root, filePath),
        content: fileContent,
        range: {
          start: {
            line: originLoc.line,
            column: originLoc.column ?? 0,
          },
          end: {
            line: originLoc.line,
            column: (originLoc.column ?? 0) + (err.location.length ?? 0),
          },
        },
      },
    };

    return data;
  }

  getResult() {
    return {
      assets: this._assets.slice(),
      error: this._error,
    };
  }

  async run({ source, sourceMap }: BundlerResult): Promise<void> {
    this.init(source, sourceMap);

    const result = runScript<() => Promise<AssetData[]>>(this._code, {
      dirname: __dirname,
      globalParams: this.getContext(),
    });

    if (result.error) {
      this._error = await this.parseError(result.error);
    }

    if (isFunc(result.output)) {
      this._assets = (await result.output()) ?? [];
    }
  }
}
