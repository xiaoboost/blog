import pinyin from 'pinyin';

import { concat } from '@xiao-ai/utils';

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
