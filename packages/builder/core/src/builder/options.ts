import type { BuilderOptions } from '@blog/types';
import { join } from 'path';
import type { Builder } from './builder';

import { parseLoader } from '../utils';
import { Logger } from '../plugins/logger';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { AssetsMerger } from '../plugins/assets-merger';
import { FileLoader } from '../plugins/file-loader';
import { PathLoader } from '../plugins/path-loader';
import { Resolver } from '../plugins/resolver';

export async function applyPlugin(builder: Builder) {
  const { options: opt } = builder;
  const loaderData = parseLoader(opt.loader);

  Logger().apply(builder);
  LocalPackageRequirer().apply(builder);
  Resolver().apply(builder);
  PathLoader({ exts: loaderData.paths }).apply(builder);
  FileLoader({
    exts: loaderData.files,
    publicPath: opt.publicPath,
    assetNames: opt.assetNames,
  }).apply(builder);

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

  // 主构建器特有插件
  if (!builder.isChild()) {
    AssetsMerger().apply(builder);
  }
}

export function normalizeOptions(opt: BuilderOptions): Required<BuilderOptions> {
  const isProduction = opt.mode === 'production';
  const root = opt.root ?? process.cwd();

  return {
    root,
    name: opt.name ?? 'Main',
    outDir: join(root, opt.outDir ?? 'dist'),
    mode: isProduction ? 'production' : 'development',
    hmr: opt.hmr ?? false,
    watch: opt.watch ?? false,
    write: opt.write ?? false,
    publicPath: opt.publicPath ?? '/',
    terminalColor: opt.terminalColor ?? true,
    assetNames: opt.assetNames ?? (isProduction ? 'assets/[name].[hash]' : 'assets/[name]'),
    defined: {
      ...opt.defined,
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      'process.env.HMR': opt.hmr ? 'true' : 'false',
    },
    loader: {
      ...opt.loader,
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.svg': 'file',
      '.jpg': 'file',
      '.png': 'file',
      '.ico': 'file',
      '.plist': 'path',
      '.wasm': 'path',
    },
  };
}
