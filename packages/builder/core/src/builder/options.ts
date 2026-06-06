/* eslint-disable import-x/no-useless-path-segments */

import { join } from 'path';
import type { BuilderOptions } from '@blog/types';

import { AssetExtractor } from '../plugins/asset-extractor';
import { AssetRenameLoader } from '../plugins/asset-rename-loader';
import { CacheController } from '../plugins/cache';
import { Cname } from '../plugins/cname';
import { GlobalAssetLoader } from '../plugins/global-asset-loader';
import { JssLoader } from '../plugins/jss-loader';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { PathLoader } from '../plugins/path-loader';
import { PostLoader } from '../plugins/post-loader';
import { RawLoader } from '../plugins/raw-loader';
import { Resolver } from '../plugins/resolver';
import { ScriptLoader } from '../plugins/script-loader';
import { getCoreRoot } from '../utils';
import type { Builder } from './builder';

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
  AssetRenameLoader([
    {
      test: /\.(woff|woff2|ttf|otf)$/,
      name: getAssetNames('fonts', isProduction),
    },
    {
      test: /\.(svg|jpg|jpeg|png|ico|webp)$/,
      name: getAssetNames('images', isProduction),
    },
    {
      test: /\.css$/,
      name: getAssetNames('styles', isProduction),
    },
    {
      test: /\.js$/,
      name: getAssetNames('scripts', isProduction),
    },
    {
      test: /.*/,
      name: getAssetNames('assets', isProduction),
    },
  ]).apply(builder);
  GlobalAssetLoader([
    {
      test: /\.(woff|woff2|ttf|otf|svg|jpg|jpeg|png|ico|webp)$/,
    },
  ]).apply(builder);

  RawLoader({ test: /\.(woff|woff2|ttf|otf)$/ }).apply(builder);

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
    GlobalAssetLoader([{ test: /\.(css|js)$/ }]).apply(builder);

    if (opt.watch) {
      const { Development } = await import('../plugins/development/index.js');
      Development({ port: opt.port, hmr: opt.hmr }).apply(builder);
    }

    if (opt.debug) {
      const { Interceptor } = await import('../plugins/interceptor/index.js');
      Interceptor({
        excludes: [
          'logger', 'watcher', 'cname',
          'asset-extractor', 'asset-writer', 'cleaner',
          'cacheController', 'local-package',
          'type-checker', 'development',
        ],
        outFile: process.env.ENV === 'GITHUB_CI' ? process.env.ENV_OUTPUT : undefined,
      }).apply(builder);
    }

    if (opt.typeCheck) {
      const { TypeChecker } = await import('../plugins/type-checker/index.js');
      TypeChecker({
        basePath: getCoreRoot(),
        configFile: require.resolve('@blog/builder-generator/tsconfig'),
        typescriptPath: require.resolve('typescript'),
      }).apply(builder);
    }
  }

  // 应用外部插件
  opt.plugins.forEach((item) => item.apply(builder));
}

export function normalizeOptions(opt: BuilderOptions): Required<BuilderOptions> {
  const isProduction = opt.mode === 'production';
  const root = opt.root ?? process.cwd();

  return {
    root,
    entry: opt.entry ?? require.resolve('@blog/builder-generator'),
    name: opt.name ?? 'Main',
    outDir: join(root, opt.outDir ?? 'dist'),
    mode: isProduction ? 'production' : 'development',
    hmr: opt.hmr ?? false,
    port: opt.port ?? 7777,
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
