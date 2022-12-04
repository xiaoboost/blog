import type { CommandOptions, BuilderOptions } from '@blog/types';
import { join } from 'path';
import type { Builder } from './builder';
import { Logger } from '../plugins/logger';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { FilesCache } from '../plugins/files-cache';
import { ErrorPrinter } from '../plugins/error-printer/index';

export async function applyPlugin(builder: Builder) {
  const { options: opt } = builder;

  Logger().apply(builder);
  LocalPackageRequirer().apply(builder);
  FilesCache({ exts: opt.cacheFilesExts }).apply(builder);
  ErrorPrinter().apply(builder);

  if (opt.watch) {
    const { Watcher } = await import('../plugins/watcher.js');
    Watcher().apply(builder);
  }
}

export function normalizeOptions(opt: CommandOptions): BuilderOptions {
  const isProduction = opt.mode === 'production';

  return {
    outDir: join(process.cwd(), opt.outDir ?? 'dist'),
    mode: isProduction ? 'production' : 'development',
    hmr: opt.hmr ?? false,
    watch: opt.watch ?? false,
    publicPath: '/',
    terminalColor: opt.terminalColor ?? true,
    assetNames: isProduction ? 'assets/[name].[hash]' : 'assets/[name]',
    cacheFilesExts: ['.plist', '.wasm', '.ico'],
    defined: {
      'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      'process.env.HMR': opt.hmr ? 'true' : 'false',
    },
    loader: {
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.svg': 'file',
      '.jpg': 'file',
      '.png': 'file',
      '.ico': 'file',
    },
  };
}
