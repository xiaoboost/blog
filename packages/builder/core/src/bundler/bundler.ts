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
import { AsyncSeriesBailHook, AsyncSeriesHook } from 'tapable';
import { getRoot, parseLoader } from '../utils';
import { BridgePlugin } from './bridge';

export class Bundler implements BundlerInstance {
  private builder: BuilderInstance;

  private instance?: BuildIncremental;

  private assets: AssetData[] = [];

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
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

    const { options: opt, root } = this.builder;
    const isProduction = opt.mode === 'production';
    const esbuildConfig: BuildOptions = {
      entryPoints: [join(getRoot(), 'src/bundler/source/index.ts')],
      outdir: join(root, opt.outDir),
      metafile: false,
      bundle: true,
      format: 'cjs',
      target: 'esnext',
      write: false,
      logLevel: 'silent',
      sourcemap: isProduction ? false : 'external',
      minify: isProduction,
      mainFields: ['source', 'module', 'main'],
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      publicPath: opt.publicPath,
      assetNames: opt.assetNames,
      external: builtinModules,
      splitting: false,
      watch: false,
      charset: 'utf8',
      incremental: opt.watch,
      logLimit: 5,
      platform: 'node',
      define: opt.defined,
      loader: parseLoader(opt.loader).loader,
      plugins: [BridgePlugin(this)],
    };

    this.instance = (await esbuild(esbuildConfig)) as BuildIncremental;
  }

  getAssets(): AssetData[] {
    return this.assets.slice();
  }

  getBundledCode(): BundlerResult {
    const output = this.instance?.outputFiles ?? [];
    const source = output.find((item) => item.path.endsWith('index.js'));
    const sourceMap = output.find((item) => item.path.endsWith('index.js.map'));

    return {
      source: source?.text ?? '',
      sourceMap: sourceMap?.text ?? '',
    };
  }

  dispose() {
    this.instance?.stop?.();
    this.instance?.rebuild.dispose();
  }
}
