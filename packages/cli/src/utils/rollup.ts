import * as rollup from 'rollup';

import { transArr } from './array';
import { resolveRoot } from './path';

import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

const baseConfig: rollup.RollupOptions = {
  external: ['path', 'fs', 'fs-extra'],
  plugins: [
  commonjs({
    exclude: 'src/**',
    include: 'node_modules/**',
  }),
  typescript({
    tsconfig: resolveRoot('tsconfig.json'),
    target: 'es5',
    module: 'esnext',
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }),
  nodeResolve({
    extensions: ['.tsx', '.ts', '.js', '.json'],
    mainFields: ['index.tsx', 'index.ts'],
    rootDir: resolveRoot(),
  }),
  ],
  watch: {
  skipWrite: true,
  },
};

function mergeRollupOpt(...opts: rollup.RollupOptions[]) {
  const option: rollup.RollupOptions = {};

  opts.forEach((opt) => {
  option.input = opt.input;
  option.output = Object.assign({}, option.output, opt.output);
  option.plugins = ([] as rollup.Plugin[]).concat(option.plugins || [], opt.plugins || []);
  option.external = transArr(option.external).concat(opt.external || []) as string[];
  });

  const output = (option.output || { format: 'iife' }) as rollup.OutputOptions;

  delete option.output;

  return { option, output };
}

export * from 'rollup';

export async function build(opt: rollup.RollupOptions) {
  const { option, output } = mergeRollupOpt(baseConfig, opt);
  const bundle = await rollup.rollup(option);
  const result = await bundle.generate(output as rollup.OutputOptions);

  return result.output[0].code;
}

export enum WatchEventType {
  Start,
  End,
  Error,
}

type WatchEvent =
  | { type: WatchEventType.Start }
  | { type: WatchEventType.End; code: string }
  | { type: WatchEventType.Error; error: rollup.RollupError };

export function watch(opt: rollup.RollupWatchOptions, handler: (event: WatchEvent) => void) {
  const { option, output } = mergeRollupOpt(baseConfig, opt);
  const watcher = rollup.watch({
  ...option,
  watch: {
    skipWrite: true,
  },
  });


  watcher.on('event', async (event) => {
  if (event.code === 'START') {
    handler({ type: WatchEventType.Start });
  }
  else if (event.code === 'BUNDLE_END') {
    const result = await event.result.generate(output);

    handler({
    type: WatchEventType.End,
    code: result.output[0].code,
    });
  }
  else if (event.code === 'ERROR') {
    handler({
    type: WatchEventType.Error,
    error: event.error,
    });
  }
  });

  return watcher;
}
