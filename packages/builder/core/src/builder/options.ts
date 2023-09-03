import type { BuilderOptions } from '@blog/types';
import { join } from 'path';
import type { Builder } from './builder';

import { getCoreRoot } from '../utils';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { FileLoader } from '../plugins/file-loader';
import { PathLoader } from '../plugins/path-loader';
import { Resolver } from '../plugins/resolver';
import { JssLoader } from '../plugins/jss-loader';
import { ScriptLoader } from '../plugins/script-loader';
import { PostLoader } from '../plugins/post-loader';
import { AssetExtractor } from '../plugins/asset-extractor';
import { Cname } from '../plugins/cname';
import { CacheController } from '../plugins/cache';

const getAssetNames = (name: string, isProduction: boolean) =>
  isProduction ? `${name}/[name].[hash].[ext]` : `${name}/[name].[ext]`;

export async function applyPlugin(builder: Builder) {
  const { options: opt } = builder;
  const isProduction = opt.mode === 'production';

  if (opt.logLevel !== 'Silence') {
    const { Logger } = await import('../plugins/logger.js');
    Logger().apply(builder);
  }

  Resolver().apply(builder);
  PathLoader({ test: /\.(plist|wasm)$/ }).apply(builder);
  FileLoader([
    {
      test: /\.(woff|woff2|ttf)$/,
      name: getAssetNames('fonts', isProduction),
    },
    {
      test: /\.(svg|jpg|png|ico)$/,
      name: getAssetNames('images', isProduction),
    },
  ]).apply(builder);

  if (opt.watch) {
    const { Watcher } = await import('../plugins/watcher.js');
    Watcher().apply(builder);
  }

  if (opt.write) {
    const { AssetWriter } = await import('../plugins/asset-writer.js');
    const { Cleaner } = await import('../plugins/cleaner.js');
    AssetWriter().apply(builder);
    Cleaner().apply(builder);
  }

  // 主构建器插件
  if (!builder.isChild()) {
    Cname().apply(builder);
    AssetExtractor().apply(builder);
    LocalPackageRequirer().apply(builder);
    PostLoader().apply(builder);
    ScriptLoader().apply(builder);
    CacheController().apply(builder);
    JssLoader({ extractAsset: false }).apply(builder);

    if (opt.watch) {
      const { Development } = await import('../plugins/development/index.js');
      Development({ port: 9999, hmr: opt.hmr }).apply(builder);
    }

    if (opt.debug) {
      const { Intercepter } = await import('../plugins/intercepter/index.js');
      Intercepter({
        excludes: ['logger', 'watcher', 'cname'],
        outFile: process.env.ENV === 'GITHUB_CI' ? process.env.ENV_OUTPUT : undefined,
      }).apply(builder);
    }

    if (opt.typeCheck) {
      const { TypeChecker } = await import('../plugins/type-checker/index.js');
      TypeChecker({
        basePath: getCoreRoot(),
        configFile: './src/bundler/source/tsconfig.json',
        typescriptPath: require.resolve('typescript'),
      }).apply(builder);
    }

    FileLoader([
      {
        test: /\.css$/,
        name: getAssetNames('styles', isProduction),
      },
      {
        test: /\.js$/,
        name: getAssetNames('scripts', isProduction),
      },
    ]).apply(builder);
  }

  // 应用外部插件
  opt.plugins.forEach((item) => item.apply(builder));
}

export function normalizeOptions(opt: BuilderOptions): Required<BuilderOptions> {
  const isProduction = opt.mode === 'production';
  const root = opt.root ?? process.cwd();

  return {
    root,
    entry: opt.entry ?? join(getCoreRoot(), 'src/bundler/source/index.ts'),
    name: opt.name ?? 'Main',
    outDir: join(root, opt.outDir ?? 'dist'),
    mode: isProduction ? 'production' : 'development',
    hmr: opt.hmr ?? false,
    watch: opt.watch ?? false,
    write: opt.write ?? false,
    publicPath: opt.publicPath ?? '/',
    terminalColor: opt.terminalColor ?? true,
    plugins: opt.plugins ?? [],
    logLevel: opt.logLevel ?? 'Info',
    debug: opt.debug ?? false,
    typeCheck: opt.typeCheck ?? true,
    cache: opt.cache ?? '.cache',
    defined: {
      ...opt.defined,
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      'process.env.HMR': opt.hmr ? 'true' : 'false',
    },
  };
}
