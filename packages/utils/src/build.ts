import type { BuildOptions } from 'esbuild';
import { isDevelopment } from './env';
import { isString, AnyObject } from '@xiao-ai/utils';

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

export function getCliOption<T = AnyObject>(): T {
  const options: AnyObject = {};
  const matcher = /--([a-zA-Z]+?)(:[^=]+?)?(=[^$]+?)?$/;
  const args = process.argv.filter((arg) => arg.startsWith('--'));

  for (const arg of args) {
    const matchResult = matcher.exec(arg);

    if (!matchResult) {
      continue;
    }

    const optName = matchResult[1];

    let optValue: string[] | string | boolean = matchResult[3] ? matchResult[3].slice(1) : true;

    if (isString(optValue) && optValue.includes(',')) {
      optValue = optValue.split(',');
    }

    if (matchResult[2]) {
      const subName = matchResult[2].slice(1);

      if (!options[optName]) {
        options[optName] = {};
      }

      options[optName][subName] = optValue;
    }
    else {
      options[optName] = optValue;
    }
  }

  return options as T;
}
