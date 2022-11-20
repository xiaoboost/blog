import { pinyin } from 'pinyin-pro';
import { AnyObject } from '@xiao-ai/utils';
import { URLSearchParams } from 'url';

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

export type Query = Record<string, string | boolean>;

export function parseQuery(input: string) {
  const [base, rawQuery] = input.split('?');
  const searchParams = new URLSearchParams(rawQuery);
  const query: Query = {};

  searchParams.forEach((value, key) => {
    if (value.length === 0 || value === 'true') {
      query[key] = true;
    } else if (value === 'false') {
      query[key] = false;
    } else {
      query[key] = value;
    }
  });

  return {
    base,
    rawQuery,
    query,
  };
}
