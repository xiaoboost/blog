import { BuildOptions, BuildIncremental, build as esbuild, OnLoadResult } from 'esbuild';
import { join } from 'path';
import { builtinModules } from 'module';
import {
  BundlerHooks,
  BundlerInstance,
  BuilderInstance,
  AssetData,
  BundlerResult,
  OnResolveResult,
  OnResolveArgs,
  OnLoadArgs,
  OnResolveCallbackResult,
  OnLoadCallbackResult,
} from '@blog/types';
import { AsyncSeriesBailHook, AsyncSeriesHook, SyncWaterfallHook } from 'tapable';
import { BridgePlugin } from './bridge';

export class Bundler implements BundlerInstance {
  /** 打包产物文件名称 */
  static BundleFileName = '__bundleFile.js';

  private builder: BuilderInstance;

  private instance?: BuildIncremental;

  private assets: AssetData[] = [];

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      initialization: new SyncWaterfallHook<[BuildOptions]>(['options']),
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], OnResolveCallbackResult>(['resolveArgs']),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadCallbackResult>(['loadArgs']),
      resolveResult: new AsyncSeriesHook<[OnResolveResult]>(['resolveResult']),
      loadResult: new AsyncSeriesHook<[OnLoadResult]>(['loadResult']),
    };
  }

  async bundle() {
    // 初始化
    this.assets = [];

    // 有实例，则直接重新构建
    if (this.instance) {
      this.instance = await this.instance.rebuild();
    }

    const { builder, hooks } = this;
    const { options: opt, root } = builder;
    const esbuildConfig: BuildOptions = hooks.initialization.call({
      entryPoints: [opt.entry],
      outfile: join(root, 'virtual', Bundler.BundleFileName),
      metafile: false,
      bundle: true,
      format: 'cjs',
      target: 'esnext',
      write: false,
      logLevel: 'silent',
      sourcemap: 'external',
      minify: false,
      mainFields: ['source', 'module', 'main'],
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      publicPath: opt.publicPath,
      external: builtinModules,
      splitting: false,
      watch: false,
      charset: 'utf8',
      incremental: opt.watch,
      logLimit: 5,
      platform: 'node',
      define: opt.defined,
      plugins: [BridgePlugin(this)],
    });

    this.instance = (await esbuild(esbuildConfig)) as BuildIncremental;
    this.assets = (this.instance.outputFiles ?? []).map((file) => ({
      path: file.path,
      content: Buffer.from(file.contents),
    }));
  }

  getAssets(): AssetData[] {
    return this.assets.slice();
  }

  getBundledCode(): BundlerResult {
    const output = this.instance?.outputFiles ?? [];
    const source = output.find((item) => item.path.endsWith(Bundler.BundleFileName));
    const sourceMap = output.find((item) => item.path.endsWith(`${Bundler.BundleFileName}.map`));

    return {
      source: source?.text ?? '',
      sourceMap: sourceMap?.text ?? '',
    };
  }

  dispose() {
    this.instance?.stop?.();
    this.instance?.rebuild?.dispose?.();
  }
}
