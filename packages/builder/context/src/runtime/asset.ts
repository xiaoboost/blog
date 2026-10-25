import { readFileSync } from 'fs';
import { isAbsolute, normalize } from 'path';
import { getAccessor } from './accessor';

/**
 * 读取并缓存本地资源
 *
 * @description 文件会跨 VM 进行缓存
 */
export function readAssetCached(absolutePath: string): Buffer {
  if (!isAbsolute(absolutePath)) {
    throw new TypeError(`读取文件必须使用绝对路径：${absolutePath}`);
  }

  const sourcePath = normalize(absolutePath);
  const accessor = getAccessor(`page-asset:${sourcePath}`, () => {
    return readFileSync(sourcePath);
  });
  return accessor.get() ?? readFileSync(sourcePath);
}
