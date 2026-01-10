import { BuildOptions, BuildContext, BuildResult, context, OnLoadResult } from 'esbuild';
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
import { BundleFileName, isBundleFile } from './utils';

export class Bundler implements BundlerInstance {
  private builder: BuilderInstance;

  private instance?: BuildContext;

  private buildResult?: BuildResult;

  private assets: AssetData[] = [];

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      initialization: new SyncWaterfallHook<[BuildOptions]>(['options']),
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], OnResolveCallbackResult>(['resolveArgs']),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadCallbackResult>(['loadArgs']),
      resolveResult: new AsyncSeriesHook<[OnResolveResult, OnResolveArgs]>(['result', 'args']),
      loadResult: new AsyncSeriesHook<[OnLoadResult, OnLoadArgs]>(['result', 'args']),
    };
  }

  async bundle() {
    // 初始化
    this.assets = [];

    // 有实例，则直接重新构建
    if (this.instance) {
      this.buildResult = await this.instance.rebuild();
    } else {
      const { builder, hooks } = this;
      const { options: opt, root } = builder;
      const esbuildConfig: BuildOptions = hooks.initialization.call({
        entryPoints: [opt.entry],
        outfile: join(root, 'virtual', `${BundleFileName}.js`),
        metafile: false,
        bundle: true,
        format: 'cjs',
        target: 'esnext',
        write: false,
        logLevel: 'silent',
        sourcemap: 'external',
        minify: false,
        mainFields: ['source', 'module', 'main'],
        resolveExtensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
        publicPath: opt.publicPath,
        external: builtinModules.slice(),
        splitting: false,
        charset: 'utf8',
        logLimit: 5,
        platform: 'node',
        define: opt.defined,
        plugins: [BridgePlugin(this)],
      });

      this.instance = await context(esbuildConfig);
      this.buildResult = await this.instance.rebuild();
    }
  }

  getAssets(includeOutput = false): AssetData[] {
    const assets = this.assets.slice();

    if (includeOutput) {
      assets.push(
        ...(this.buildResult?.outputFiles ?? []).map((item) => ({
          path: item.path,
          content: Buffer.from(item.contents),
        })),
      );
    }

    return assets;
  }

  getBundledCode(): BundlerResult {
    const output = this.buildResult?.outputFiles ?? [];
    const source = output.find(({ path }) => isBundleFile(path) && /\.js$/.test(path));
    const sourceMap = output.find(({ path }) => isBundleFile(path) && /\.js\.map$/.test(path));

    return {
      source: source?.text ?? '',
      sourceMap: sourceMap?.text ?? '',
    };
  }

  dispose() {
    return this.instance?.dispose?.();
  }
}
