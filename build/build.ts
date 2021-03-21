import { build } from 'esbuild';
import { resolveRoot, isDevelopment } from './utils';
import { mergeConfig } from './process/utils';

build(mergeConfig({
  entryPoints: [resolveRoot('build/index.ts')],
  outfile: resolveRoot('builder/index.js'),
  write: true,
  logLevel: 'info',
  watch: isDevelopment,
  sourcemap: isDevelopment,
  publicPath: undefined,
}));
