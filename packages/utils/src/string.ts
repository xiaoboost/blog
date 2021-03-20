import pinyin from 'pinyin';

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

export function toPinyin(str: string) {
  const strings = concat(pinyin(str, { style: pinyin.STYLE_NORMAL }), (arr) => arr);

  return strings
    .join('-')
    .toLowerCase()
    .replace(/[^-a-z]/g, '')
    .replace(/([a-zA-Z0-9]+)/g, '-$1-')
    .replace(/[ \-]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
