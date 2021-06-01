import { BuildOptions } from 'esbuild';
import { aliasPlugin } from '../plugins';
import { parseUrl, isDevelopment, resolveRoot } from '../utils';
import { publicPath, assetsPath } from '../config/project';
import { dependencies, devDependencies } from '../../package.json';

/** 需要打包进去的库 */
const bundleDeps = ['tslib', '@xiao-ai/utils'];
/** 排除的库 */
const bundleDep = Object.keys(dependencies)
  .concat(Object.keys(devDependencies))
  .filter((key) => !bundleDeps.includes(key));

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
    external: bundleDep,
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
    plugins: [
      aliasPlugin({
        '@xiao-ai/utils': resolveRoot('node_modules/@xiao-ai/utils/dist/esm/index.js'),
        '@xiao-ai/utils/use': resolveRoot('node_modules/@xiao-ai/utils/dist/esm/use/index.js'),
        '@xiao-ai/utils/web': resolveRoot('node_modules/@xiao-ai/utils/dist/esm/web/index.js'),
      }),
    ].concat(opt.plugins ?? []),
  };
}
