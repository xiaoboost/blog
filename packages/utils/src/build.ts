import type { BuildOptions } from 'esbuild';
import { isDevelopment } from './env';
import { isDef } from '@xiao-ai/utils';

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

export function getCliOption(name: string) {
  const args = process.argv;
  const matcher = new RegExp(`--${name}=([\\d\\D]+)`);
  const option = args.map((input) => matcher.exec(input)).find(isDef);

  if (!option) {
    throw new Error(`没有找到指令'${name}'。`);
  }

  return option[1];
}
