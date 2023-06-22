import { basename } from 'path';

/** 打包产物文件名称 */
export const BundleFileName = '__bundleFile';

/** 是否是打包产物 */
export function isBundleFile(file: string) {
  return basename(file).startsWith(BundleFileName);
}
