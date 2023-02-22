import { pinyin } from 'pinyin-pro';
import { URLSearchParams } from 'url';

export type Query = Record<string, string | boolean>;

/** 汉字转换为拼音 */
export function toPinyin(str: string) {
  const strings = pinyin(str.replace(/[\s]+/g, '-'), {
    type: 'array',
    toneType: 'num',
    nonZh: 'consecutive',
  });

  return strings.join('-').replace(/-+/g, '-').toLowerCase();
}

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
