import type { BuilderOptions } from '@blog/types';
import { join } from 'path';
import type { Builder } from './builder';

import { getCoreRoot } from '../utils';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { AssetsMerger } from '../plugins/assets-merger';
import { FileLoader } from '../plugins/file-loader';
import { PathLoader } from '../plugins/path-loader';
import { Resolver } from '../plugins/resolver';
import { JssLoader } from '../plugins/jss-loader';
import { ScriptLoader } from '../plugins/script-loader';

export async function applyPlugin(builder: Builder) {
  const { options: opt } = builder;
  const isProduction = builder.options.mode === 'production';
  const getAssetNames = (name: string) =>
    isProduction ? `${name}/[name].[hash][ext]` : `${name}/[name][ext]`;

  LocalPackageRequirer().apply(builder);
  Resolver().apply(builder);
  PathLoader({ test: /\.(plist|wasm)$/ }).apply(builder);
  FileLoader({ test: /\.(woff|woff2|ttf)$/, name: getAssetNames('fonts') }).apply(builder);
  FileLoader({ test: /\.(svg|jpg|png|ico)$/, name: getAssetNames('images') }).apply(builder);
  FileLoader({ test: /\.css$/, name: getAssetNames('styles') }).apply(builder);
  FileLoader({ test: /\.js$/, name: getAssetNames('scripts') }).apply(builder);

  if (opt.watch) {
    const { Watcher } = await import('../plugins/watcher.js');
    Watcher().apply(builder);
  }

  if (opt.write) {
    const { AssetsWriter } = await import('../plugins/assets-writer.js');
    const { Cleaner } = await import('../plugins/cleaner.js');
    AssetsWriter().apply(builder);
    Cleaner().apply(builder);
  }

  if (opt.logLevel !== 'Silence') {
    const { Logger } = await import('../plugins/logger.js');
    Logger().apply(builder);
  }

  // 主构建器插件
  if (!builder.isChild()) {
    AssetsMerger().apply(builder);
    ScriptLoader().apply(builder);
    JssLoader({ extractCss: false }).apply(builder);
  }

  // 应用外部插件
  opt.plugin.forEach((item) => item.apply(builder));
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
    plugin: opt.plugin ?? [],
    logLevel: opt.logLevel ?? 'Info',
    defined: {
      ...opt.defined,
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      'process.env.HMR': opt.hmr ? 'true' : 'false',
    },
  };
}
