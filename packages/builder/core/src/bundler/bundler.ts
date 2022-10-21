import {
  BuildOptions,
  OnResolveArgs,
  ResolveResult,
  OnLoadArgs,
  OnLoadResult,
  BuildIncremental,
  BuildInvalidate,
  build as esbuild,
} from 'esbuild';
import { join } from 'path';
import { BundleResult, BundlerHooks, BundlerInstance, BuilderInstance } from '@blog/types';
import { AsyncSeriesBailHook, SyncHook } from 'tapable';
import { getRoot } from '../utils';

export class Bundler implements BundlerInstance {
  private builder: BuilderInstance;

  private instance?: BuildIncremental;

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      configuration: new SyncHook<[], BuildOptions | undefined>(),
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], ResolveResult | undefined>(['resolveArgs']),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined>(['loadArgs']),
    };
  }

  private async build(): Promise<BuildIncremental> {
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
      publicPath: '/',
      splitting: false,
      watch: false,
      charset: 'utf8',
      incremental: true,
      logLimit: 5,
      platform: 'node',
      define: {
        'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
        'process.env.HMR': opt.hmr ? 'true' : 'false',
      },
      loader: {
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.svg': 'file',
      },
    };

    try {
      this.instance = (await esbuild(esbuildConfig)) as BuildIncremental;
      return this.instance;
    } catch (error: any) {
      await this.report(error);

      if (compiler.config.watch) {
        const rebuild: BuildInvalidate = () => this.build();
        rebuild.dispose = () => void 0;
        this.instance = {
          errors: [],
          warnings: [],
          rebuild: rebuild as BuildInvalidate,
        };
      }
    }

    return this.instance;
  }

  dispose() {
    this.instance?.stop?.();
    this.instance?.rebuild.dispose();
  }

  async bundle(): Promise<BundleResult> {
    return {} as Promise<BundleResult>;
  }
}
