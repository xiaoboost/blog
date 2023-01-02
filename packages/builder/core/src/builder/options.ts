import type { BuilderOptions } from '@blog/types';
import { join } from 'path';
import type { Builder } from './builder';

import { getCoreRoot } from '../utils';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { FileLoader, getAssetNames } from '../plugins/file-loader';
import { PathLoader } from '../plugins/path-loader';
import { Resolver } from '../plugins/resolver';
import { JssLoader } from '../plugins/jss-loader';
import { ScriptLoader } from '../plugins/script-loader';
import { PostLoader } from '../plugins/post-loader';
import { AssetExtractor } from '../plugins/asset-extractor';
import { Cname } from '../plugins/cname';

export async function applyPlugin(builder: Builder) {
  const { options: opt } = builder;
  const isProduction = opt.mode === 'production';

  LocalPackageRequirer().apply(builder);
  Resolver().apply(builder);
  PostLoader().apply(builder);
  PathLoader({ test: /\.(plist|wasm)$/ }).apply(builder);
  FileLoader({ test: /\.(woff|woff2|ttf)$/, name: getAssetNames('fonts', isProduction) }).apply(
    builder,
  );
  FileLoader({ test: /\.(svg|jpg|png|ico)$/, name: getAssetNames('images', isProduction) }).apply(
    builder,
  );

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

  if (opt.logLevel !== 'Silence') {
    const { Logger } = await import('../plugins/logger.js');
    Logger().apply(builder);
  }

  // 主构建器插件
  if (!builder.isChild()) {
    Cname().apply(builder);
    AssetExtractor().apply(builder);
    ScriptLoader().apply(builder);
    JssLoader({ extractCss: false }).apply(builder);
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
    defined: {
      ...opt.defined,
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      'process.env.HMR': opt.hmr ? 'true' : 'false',
    },
  };
}
