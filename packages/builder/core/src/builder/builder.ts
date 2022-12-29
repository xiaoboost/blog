import {
  BuilderHooks,
  BuilderInstance,
  BuilderOptions,
  AssetData,
  BuilderHookContext,
} from '@blog/types';
import { AsyncSeriesHook, AsyncParallelHook, AsyncSeriesWaterfallHook } from 'tapable';
import { FSWatcher } from 'chokidar';
import { BuilderError } from '../utils';
import { applyPlugin, normalizeOptions } from './options';
import { Bundler } from '../bundler';
import { Runner } from '../runner';

export class Builder implements BuilderInstance {
  private bundler: Bundler;

  private runner: Runner;

  private watcher?: FSWatcher;

  private watchFiles = new Set<string>();

  private parent?: Builder;

  private errors: BuilderError[] = [];

  private assets: AssetData[] = [];

  private children: Builder[] = [];

  hooks: BuilderHooks;

  options: Required<BuilderOptions>;

  constructor(opt: BuilderOptions, parent?: Builder) {
    this.parent = parent;
    this.bundler = new Bundler(this);
    this.runner = new Runner(this);
    this.options = normalizeOptions(opt);
    this.hooks = {
      initialization: new AsyncSeriesHook<[Required<BuilderOptions>]>(['Options']),
      start: new AsyncSeriesHook<[]>(),
      success: new AsyncSeriesHook<[AssetData[]]>(['Assets']),
      done: new AsyncSeriesHook<[BuilderHookContext]>(['Context']),
      failed: new AsyncSeriesHook<[BuilderError[]]>(['Errors']),
      filesChange: new AsyncParallelHook<[string[]]>(['Files']),
      watcher: new AsyncSeriesHook<[FSWatcher]>(['Watcher']),
      bundler: new AsyncSeriesHook<[Bundler]>(['Bundler']),
      runner: new AsyncSeriesHook<[Runner]>(['Runner']),
      processAssets: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
    };
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
    try {
      await this.hooks.start.promise();
      await this.hooks.bundler.promise(this.bundler);
      await this.bundler.bundle();
      await this.hooks.runner.promise(this.runner);
      await this.runner.run(this.bundler.getBundledCode());
      this.assets = await this.hooks.processAssets.promise(this.getAssets());
      await this.hooks.success.promise(this.getAssets());
    } catch (e: any) {
      this.errors = this._reportError(e);
      await this.hooks.failed.promise(this.getErrors());
    }
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

  getAssets(): AssetData[] {
    return this.children
      .map((child) => child.getAssets())
      .reduce((ans, item) => ans.concat(item), [] as AssetData[])
      .concat(this.assets.slice());
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
