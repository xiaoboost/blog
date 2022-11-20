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
import { BundlerHooks, BundlerInstance, BuilderInstance } from '@blog/types';
import { AsyncSeriesBailHook } from 'tapable';
import { getRoot } from '../utils';
import { BridgePlugin } from './bridge';
import { outputFileName } from './constant';

export class Bundler implements BundlerInstance {
  private builder: BuilderInstance;

  private instance?: BuildIncremental;

  hooks: BundlerHooks;

  constructor(builder: BuilderInstance) {
    this.builder = builder;
    this.hooks = {
      resolve: new AsyncSeriesBailHook<[OnResolveArgs], OnResolveResult | undefined>([
        'resolveArgs',
      ]),
      load: new AsyncSeriesBailHook<[OnLoadArgs], OnLoadResult | undefined>(['loadArgs']),
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

    debugger;
    const { options: opt, root } = this.builder;
    const isProduction = opt.mode === 'production';
    const esbuildConfig: BuildOptions = {
      entryPoints: [join(getRoot(), 'src/bundler/source/index.ts')],
      outdir: join(root, opt.outDir),
      outfile: outputFileName,
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
    debugger;
    const codeFile = output.find((item) => item.path.endsWith('.js'));
    return codeFile?.text ?? '';
  }

  dispose() {
    this.instance?.stop?.();
    this.instance?.rebuild.dispose();
  }
}
