import {
  BuildOptions,
  OnResolveArgs,
  OnResolveResult,
  OnLoadArgs,
  OnLoadResult,
  BuildIncremental,
  BuildInvalidate,
  build as esbuild,
} from 'esbuild';
import { join } from 'path';
import { builtinModules } from 'module';
import { BundlerHooks, BundlerInstance, BuilderInstance } from '@blog/types';
import { AsyncSeriesBailHook } from 'tapable';
import { getRoot } from '../utils';
import { BridgePlugin } from './bridge';

export class Bundler implements BundlerInstance {
  private builder: BuilderInstance;

  private instance?: BuildIncremental;

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], OnResolveResult | undefined | null>([
        'resolveArgs',
      ]),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined | null>(['loadArgs']),
    };
  }

  private report(err: any) {
    debugger;
  }

  async bundle(): Promise<BuildIncremental> {
    // 有实例，则直接重新构建
    if (this.instance) {
      this.instance = await this.instance.rebuild();
      return this.instance;
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
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction,
      mainFields: ['source', 'module', 'main'],
      resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      publicPath: opt.publicPath,
      assetNames: opt.assetNames,
      external: builtinModules,
      splitting: false,
      watch: false,
      charset: 'utf8',
      incremental: true,
      logLimit: 5,
      platform: 'node',
      define: opt.defined,
      loader: opt.loader,
      plugins: [BridgePlugin(this)],
    };

    try {
      this.instance = (await esbuild(esbuildConfig)) as BuildIncremental;
      return this.instance;
    } catch (error: any) {
      debugger;
      this.report(error);

      if (opt.isWatch) {
        const rebuild: BuildInvalidate = () => this.bundle();
        rebuild.dispose = () => void 0;
        this.instance = {
          errors: [],
          warnings: [],
          rebuild,
        };
      }
    }

    return this.instance!;
  }

  getBundledCode() {
    const output = this.instance?.outputFiles ?? [];
    const codeFile = output.find((item) => item.path.endsWith('index.js'));
    return codeFile?.text ?? '';
  }

  dispose() {
    this.instance?.stop?.();
    this.instance?.rebuild.dispose();
  }
}
