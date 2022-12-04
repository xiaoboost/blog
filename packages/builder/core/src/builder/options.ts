import type { CommandOptions, BuilderOptions } from '@blog/types';
import type { Builder } from './builder';
import { LoggerPlugin } from '../plugins/logger';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { FilesCache } from '../plugins/files-cache';
import { ErrorPrinter } from '../plugins/error-printer/index';

export function applyPlugin(builder: Builder) {
  const { options: opt } = builder;

  LoggerPlugin().apply(builder);
  LocalPackageRequirer().apply(builder);
  FilesCache({ exts: opt.cacheFilesExts }).apply(builder);
  ErrorPrinter().apply(builder);
}

export function normalizeOptions(opt: CommandOptions): BuilderOptions {
  const isProduction = opt.mode === 'production';

  return {
    outDir: opt.outDir ?? 'dist',
    mode: isProduction ? 'production' : 'development',
    hmr: opt.hmr ?? false,
    isWatch: false,
    publicPath: '/',
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
