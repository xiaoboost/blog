import { pinyin } from 'pinyin-pro';
import { AnyObject } from '@xiao-ai/utils';

/** 汉字转换为拼音 */
export function toPinyin(str: string) {
  const strings = pinyin(str, {
    type: 'array',
    toneType: 'num',
    nonZh: 'consecutive',
  });

  return strings.join('-').toLowerCase();
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
