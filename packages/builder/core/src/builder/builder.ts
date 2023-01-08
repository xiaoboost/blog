import {
  BuilderHooks,
  BuilderInstance,
  BuilderOptions,
  AssetData,
  BuilderHookContext,
  ResolveOptions,
  ResolveResult,
} from '@blog/types';
import { AsyncSeriesHook, AsyncParallelHook, AsyncSeriesWaterfallHook } from 'tapable';
import { normalize } from '@blog/node';
import { Watcher } from '@xiao-ai/utils';
import { FSWatcher } from 'chokidar';
import { BuilderError } from '../utils';
import { applyPlugin, normalizeOptions } from './options';
import { Bundler } from '../bundler';
import { Runner } from '../runner';
import { Logger } from '../utils';

let _id = 1;

export class Builder implements BuilderInstance {
  private readonly id = _id++;

  private bundler: Bundler;

  private runner: Runner;

  private watcher?: FSWatcher;

  private watchFiles = new Set<string>();

  private parent?: Builder;

  private errors: BuilderError[] = [];

  private assets: AssetData[] = [];

  private children: Builder[] = [];

  private buildStatus = new Watcher(false);

  hooks: BuilderHooks;

  options: Required<BuilderOptions>;

  logger = new Logger('Silence');

  constructor(opt: BuilderOptions, parent?: Builder) {
    this.bundler = new Bundler(this);
    this.runner = new Runner(this);
    this.options = normalizeOptions(opt);
    this.hooks = {
      initialization: new AsyncSeriesHook<[Required<BuilderOptions>]>(['Options']),
      start: new AsyncSeriesHook<[]>(),
      success: new AsyncSeriesHook<[AssetData[], BuilderHookContext]>(['Assets', 'Context']),
      done: new AsyncSeriesHook<[BuilderHookContext]>(['Context']),
      failed: new AsyncSeriesHook<[BuilderError[]]>(['Errors']),
      filesChange: new AsyncParallelHook<[string[]]>(['Files']),
      watcher: new AsyncSeriesHook<[FSWatcher]>(['Watcher']),
      bundler: new AsyncSeriesHook<[Bundler]>(['Bundler']),
      runner: new AsyncSeriesHook<[Runner]>(['Runner']),
      afterBundler: new AsyncSeriesHook<[BuilderHookContext]>(['Context']),
      afterRunner: new AsyncSeriesHook<[BuilderHookContext]>(['Context']),
      processAssets: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
    };

    if (parent) {
      this.parent = parent;
      parent.children.push(this);
    }
  }

  get root() {
    return this.options.root;
  }

  get name() {
    return this.options.name;
  }

  private _getHookContext() {
    return {
      bundler: this.bundler,
      runner: this.runner,
      watcher: this.watcher,
    };
  }

  private async _build() {
    const endCompile = async () => {
      const errors = this.getErrors();

      if (errors.length > 0) {
        await this.hooks.failed.promise(errors);
      } else {
        await this.hooks.success.promise(this.getAssets(), this._getHookContext());
      }
    };

    // 如果已经在构建则等待构建完成
    if (this.buildStatus.data) {
      await this.buildStatus.once(false);
      await endCompile();
    }

    this.buildStatus.setData(true);

    try {
      await this.hooks.start.promise();
      await this.hooks.bundler.promise(this.bundler);
      await this.bundler.bundle();
      await this.hooks.afterBundler.promise(this._getHookContext());
      await this.hooks.runner.promise(this.runner);
      await this.runner.run(this.bundler.getBundledCode());
      await this.hooks.afterRunner.promise(this._getHookContext());
      this.assets = await this.hooks.processAssets.promise(this.getAssets());
    } catch (e: any) {
      this.errors = this._reportError(e);
    }

    await endCompile();
    this.buildStatus.setData(false);
  }

  private _reportError(err: any) {
    const errors = 'errors' in err ? err.errors : Array.isArray(err) ? err : [err];
    return errors.map((er: any) =>
      BuilderError.from(er, {
        project: this.name,
      }),
    );
  }

  async createChild(opt?: BuilderOptions): Promise<BuilderInstance> {
    const builder = new Builder(
      {
        ...this.options,
        root: this.root,
        name: opt?.name ?? `Child:${this.name}`,
        ...opt,
        hmr: false,
        write: false,
      },
      this,
    );

    await builder.init();

    return builder;
  }

  async init() {
    const { options, root } = this;
    const { watch, outDir } = options;

    await this.hooks.initialization.promise({ ...this.options });
    await applyPlugin(this);

    if (watch) {
      this.watcher = new FSWatcher({
        ignored: ['node_modules', '.git', '.gitignore', outDir],
        cwd: root,
      });

      await this.hooks.watcher.promise(this.watcher);
    }
  }

  isChild() {
    return Boolean(this.parent);
  }

  resolve(request: string, opt?: ResolveOptions): ResolveResult {
    throw new BuilderError({
      project: this.name,
      name: 'RESOLVE_NOT_INIT',
      message: 'resolve 方法没有初始化',
    });
  }

  addWatchFiles(...files: string[]) {
    files.forEach((file) => {
      if (!this.watchFiles.has(file)) {
        this.watchFiles.add(file);
        this.watcher?.add(file);
      }
    });
  }

  isWatchFiles(...files: string[]) {
    return files.some((file) => this.watchFiles.has(file));
  }

  getErrors(): BuilderError[] {
    return this.children
      .map((child) => child.getErrors())
      .reduce((ans, item) => ans.concat(item), [] as BuilderError[])
      .concat(this.errors.slice());
  }

  emitAsset(file: AssetData) {
    const assetPath = normalize(file.path);
    const oldAsset = this.assets.find((item) => item.path === assetPath);

    if (oldAsset) {
      oldAsset.content = file.content;
    } else {
      this.assets.push({
        path: assetPath,
        content: file.content,
      });
    }
  }

  getAssets(): AssetData[] {
    return this.assets.slice();
  }

  async stop() {
    await Promise.all(this.children.map((child) => child.stop()));
    await this.bundler.dispose();
    await this.hooks.done.promise(this._getHookContext());
  }

  async build() {
    await this._build();

    if (!this.options.watch) {
      await this.stop();
    }
  }
}
