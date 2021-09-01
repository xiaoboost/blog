import type { BuildOptions } from 'esbuild';
import { isString, AnyObject } from '@xiao-ai/utils';

export const isServe = getCliOption<boolean>('serve');
export const isDevelopment = getCliOption<boolean>('development');

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

function getOptions(args: string[]) {
  const options: AnyObject = {};
  const optionMatcher = /--([a-zA-Z]+?)(:[^=]+?)?(=[^$]+?)?$/;

  for (const arg of args) {
    const matchResult = optionMatcher.exec(arg);

    if (!matchResult) {
      continue;
    }

    const optName = matchResult[1];

    let optValue: string[] | string | boolean = matchResult[3] ? matchResult[3].slice(1) : true;

    if (isString(optValue)) {
      if (optValue === 'true') {
        optValue = true;
      }
      else if (optValue === 'false') {
        optValue = false;
      }
      else if (optValue.includes(',')) {
        optValue = optValue.split(',');
      }
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

  return options;
}

export function getCliOptions<T = AnyObject>(): T {
  const args = process.argv.filter((arg) => arg.startsWith('--'));
  return getOptions(args) as T;
}

export function getCliOption<T = any>(name: string): T {
  const args = process.argv.filter((arg) => arg.startsWith(`--${name}`));
  return getOptions(args)[name] as T;
}
