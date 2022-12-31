import path from 'path';

/** 标准化路径 */
export function normalize(str: string) {
  return str.replace(/[\\/]+/g, '/');
}

/** 编译链接 */
export function parseUrl(...paths: string[]) {
  let str = path.join(...paths).replace(/[\\/]+/g, '/');

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
