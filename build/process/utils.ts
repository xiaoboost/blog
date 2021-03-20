import { BuildOptions } from 'esbuild';
import { parseUrl, isDevelopment } from '../utils';
import { publicPath, assetsPath } from '../config/project';

import { dependencies } from '../../package.json';

/** 静态文件后缀 */
export const fileExts = ['.eot', '.otf', '.svg', '.ttf', '.woff', '.woff2', '.ico'];

export function mergeConfig(opt: BuildOptions): BuildOptions {
  return {
    write: false,
    platform: 'node',
    format: 'cjs',
    bundle: true,
    sourcemap: false,
    minify: !isDevelopment,
    treeShaking: true,
    logLevel: 'warning',
    external: Object.keys(dependencies),
    mainFields: ["source", "module", "main"],
    publicPath: parseUrl(publicPath, assetsPath),
    define: {
      ["process.env.NODE_ENV"]: isDevelopment
        ? '"development"'
        : '"production"',
    },
    loader: Object.fromEntries(
      fileExts
        .map((ext) => [ext, 'file'])
    ),
    ...opt,
  };
}
