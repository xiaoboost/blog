import type { BuildOptions } from 'esbuild';
import { isDevelopment } from './env';

export function mergeBuild(opt: BuildOptions): BuildOptions {
  const base: BuildOptions = {
    bundle: true,
    minify: true,
    write: true,
    watch: false,
    sourcemap: false,
    publicPath: '/',
    format: 'cjs',
    mainFields: ['source', 'module', 'main'],
    ...opt,
    define: {
      'process.env.NODE_ENV': isDevelopment ? `'development'` : `'production'`,
      ...opt.define,
    },
    loader: {
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      ...opt.loader,
    },
  };

  return base;
}
