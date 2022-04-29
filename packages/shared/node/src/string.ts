import pinyin from 'pinyin';

import { concat, AnyObject } from '@xiao-ai/utils';

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

export function getNameCreator(origin: string) {
  return function getName(opt: AnyObject) {
    let text = origin;

    for (const key of Object.keys(opt)) {
      text = text.replace(new RegExp(`\\[${key}\\]`, 'g'), opt[key]);
    }

    return text;
  };
}
