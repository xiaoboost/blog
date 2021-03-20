import pinyin from 'pinyin';
import path from 'path';

import { concat } from './array';
import { isString, isObject } from './assert';

export type ClassObject = Record<string, boolean>;
export type ClassInput = string | undefined | ClassObject;

/** 解析对象 class */
export function stringifyClass(...opt: ClassInput[]): string {
  /** 解析 class 对象 */
  function parseClassObject(classObject: ClassObject) {
    return Object.keys(classObject).filter((key) => classObject[key]);
  }

  const className: string[] = [];

  for (let i = 0; i < opt.length; i++) {
    const item = opt[i];

    if (isObject(item)) {
      className.push(...parseClassObject(item));
    }
    else if (isString(item)) {
      className.push(item);
    }
  }

  return className
    .join(' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' ');
}

/** 汉字转换为拼音 */
export function toPinyin(str: string) {
  const strings = concat(pinyin(str, { style: pinyin.STYLE_NORMAL }), (arr) => arr);

  return strings
    .join('-')
    .toLowerCase()
    .replace(/[^-a-z]/g, '')
    .replace(/([a-zA-Z0-9]+)/g, '-$1-')
    .replace(/[ -]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
