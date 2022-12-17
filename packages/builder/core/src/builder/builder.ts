import { BuilderHooks, BuilderInstance, BuilderOptions, AssetData } from '@blog/types';
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
      endBuild: new AsyncSeriesHook<[AssetData[], BuilderError[]]>(['Assets', 'Errors']),
      done: new AsyncSeriesHook<[]>(),
      failed: new AsyncSeriesHook<[BuilderError[]]>(['Errors']),
      filesChange: new AsyncParallelHook<[string[]]>(['Files']),
      watcher: new AsyncSeriesHook<[FSWatcher]>(['Watcher']),
      bundler: new AsyncSeriesHook<[Bundler]>(['Bundler']),
      runner: new AsyncSeriesHook<[Runner]>(['Runner']),
      processAssets: new AsyncSeriesHook<[AssetData[], AssetData[]]>([
        'BundlerAssets',
        'RunnerAssets',
      ]),
      optimizeAssets: new AsyncSeriesWaterfallHook<[AssetData[]]>(['Assets']),
    };
  }

  get root() {
    return this.options.root;
  }

  get name() {
    return this.options.name;
  }

  private async _build() {
    try {
      await this.hooks.bundler.promise(this.bundler);
      await this.bundler.bundle();
      await this.hooks.runner.promise(this.runner);
      await this.runner.run(this.bundler.getBundledCode());

      // const { error } = this.runner.getResult();

      // if (error) {
      //   this.reportError(error);
      // }
    } catch (e: any) {
      // this.reportError(e);
    }

    // if (this.errors.length > 0) {
    //   await this.hooks.fail.promise(this.errors);
    // }

    await this.hooks.endBuild.promise(this.getAssets(), this.getErrors());
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
    files.forEach((file) => this.watchFiles.add(file));
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
    await this.hooks.done.promise();
  }

  async build() {
    await this._build();

    if (!this.options.watch) {
      await this.stop();
    }
  }
}
