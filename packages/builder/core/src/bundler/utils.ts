import { basename, extname, isAbsolute } from 'path';
import type { SourceFormat } from '@blog/types';
import type { BuildOptions } from 'esbuild';

export const loaders: Record<string, SourceFormat> = {
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.mts': 'ts',
  '.cts': 'ts',
  '.tsx': 'tsx',
  '.css': 'css',
  '.json': 'json',
  '.md': 'mdx',
  '.mdx': 'mdx',
};

/** 打包产物文件名称 */
export const BundleFileName = '__bundleFile';

/** 是否是打包产物 */
export function isBundleFile(file: string) {
  return basename(file).startsWith(BundleFileName);
}

export function defaultFormat(path: string, options: BuildOptions): SourceFormat | undefined {
  const extension = Object.keys(options.loader ?? {})
    .filter((key) => path.endsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  const loader = extension ? options.loader![extension] : undefined;

  if (loader && loader !== 'default') {
    return loaders[`.${loader}`];
  }

  return loaders[extname(path)];
}

export function validateSourcePath(path?: string) {
  if (path !== undefined && (!isAbsolute(path) || path.includes('#'))) {
    throw new Error(`sourcePath 必须是绝对磁盘路径，且不能含有 #：${path}`);
  }
}
