import path from 'path';
import { platform } from 'process';
import { AnyObject } from '@xiao-ai/utils';

/** 标准化路径 */
export function normalize(...paths: string[]) {
  return path.join(...paths).replace(/[\\/]+/g, '/');
}

/** 编译链接 */
export function normalizeUrl(...paths: string[]) {
  let str = normalize(...paths);

  // 链接开始没有加上公共路径
  if (str[0] !== '/') {
    str = `/${str}`;
  }

  // 以文件结尾的链接
  if (/\.[a-z]+$/.test(str)) {
    return str;
  }

  // 链接末尾没有 / 时就加上
  if (str[str.length - 1] !== '/') {
    str += '/';
  }

  return str;
}

export function replaceExt(file: string, ext: string) {
  const oldExt = path.extname(file);
  return normalize(file.replace(oldExt, ext));
}

export function getPathFormatter(formatStr: string) {
  return function formatter(opt: AnyObject) {
    let text = formatStr;

    for (const key of Object.keys(opt)) {
      text = text.replace(new RegExp(`\\[${key}\\]`, 'g'), opt[key]);
    }

    return normalize(text);
  };
}

export function isRootDirectory(dirPath: string) {
  // 规范化路径
  const normalizedPath = path.resolve(dirPath);
  // 分析路径
  const parsedPath = path.parse(normalizedPath);

  // 对于 Windows 系统，检查根目录是否为空
  if (platform === 'win32' && parsedPath.root === '') {
    return true;
  }

  // 对于 Unix-like 系统，检查规范化后的路径是否和原始路径相同
  if (parsedPath.root === '/' && normalizedPath === dirPath) {
    return true;
  }

  // 其他情况都不是根路径
  return false;
}
