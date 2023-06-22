/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  BuilderHooks,
  BuilderInstance,
  BuilderOptions,
  AssetData,
  BuilderHookContext,
  ResolveOptions,
  ResolveResult,
} from '@blog/types';
import { AsyncSeriesHook, AsyncParallelHook, AsyncSeriesWaterfallHook, SyncHook } from 'tapable';
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

  private changedFiles = new Set<string>();

  private errors: BuilderError[] = [];

  private assets: AssetData[] = [];

  private children: Builder[] = [];

  private buildStatus = new Watcher(false);

  readonly parent?: Builder;

  hooks: BuilderHooks;

  options: Required<BuilderOptions>;

  logger = new Logger('Silence');

  constructor(opt: BuilderOptions, parent?: Builder) {
    this.bundler = new Bundler(this);
    this.runner = new Runner(this);
    this.options = normalizeOptions(opt);
    this.hooks = {
      initialization: new SyncHook<[Required<BuilderOptions>]>(['Options']),
      afterInitialized: new SyncHook<[BuilderInstance]>(['Builder']),
      start: new AsyncSeriesHook<[]>(),
      success: new AsyncSeriesHook<[AssetData[], BuilderHookContext]>(['Assets', 'Context']),
      done: new AsyncSeriesHook<[BuilderHookContext]>(['Context']),
      failed: new AsyncSeriesHook<[BuilderError[]]>(['Errors']),
      filesChange: new AsyncParallelHook<[string[]]>(['Files']),
      watcher: new AsyncSeriesHook<[FSWatcher]>(['Watcher']),
      bundler: new SyncHook<[Bundler]>(['Bundler']),
      runner: new SyncHook<[Runner]>(['Runner']),
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

  get shouldBuild(): boolean {
    if (
      // watchFiles 为空表示是首次构建
      this.watchFiles.size === 0 ||
      // changedFiles 有值表示有文件变更
      this.changedFiles.size > 0
    ) {
      return true;
    }

    return this.children.some((child) => child.shouldBuild);
  }

  private _getHookContext() {
    return {
      bundler: this.bundler,
      runner: this.runner,
      watcher: this.watcher,
    };
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

    this.hooks.initialization.call({ ...this.options });
    await applyPlugin(this);
    this.hooks.afterInitialized.call(this);

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
      const fullPath = normalize(file);
      if (!this.watchFiles.has(fullPath)) {
        this.watchFiles.add(fullPath);
        this.watcher?.add(fullPath);
      }
    });
  }

  setChangeFiles(...files: string[]) {
    this.children.forEach((child) => child.setChangeFiles(...files));

    for (const file of files) {
      const full = normalize(file);

      if (this.watchFiles.has(full)) {
        this.changedFiles.add(full);
      }
    }
  }

  getErrors(): BuilderError[] {
    return this.children
      .map((child) => child.getErrors())
      .reduce((ans, item) => ans.concat(item), [] as BuilderError[])
      .concat(this.errors.slice());
  }

  emitAsset(...files: AssetData[]) {
    for (const file of files) {
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
  }

  renameAsset(file: AssetData): string {
    throw new BuilderError({
      project: this.name,
      name: 'RENAME_NOT_INIT',
      message: 'renameAsset 方法没有初始化',
    });
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

    if (!this.shouldBuild) {
      return;
    }

    this.errors = [];
    this.changedFiles.clear();
    this.buildStatus.setData(true);

    try {
      await this.hooks.start.promise();
      this.hooks.bundler.call(this.bundler);
      await this.bundler.bundle();
      await this.hooks.afterBundler.promise(this._getHookContext());
      this.hooks.runner.call(this.runner);
      await this.runner.run(this.bundler.getBundledCode());
      await this.hooks.afterRunner.promise(this._getHookContext());
      this.assets = await this.hooks.processAssets.promise(this.getAssets());
    } catch (e: any) {
      this.errors = this._reportError(e);
    }

    await endCompile();

    this.buildStatus.setData(false);

    if (!this.options.watch) {
      await this.stop();
    }
  }
}
