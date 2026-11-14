import { URLSearchParams } from 'url';
import { pinyin } from 'pinyin-pro';

export type Query = Record<string, string | boolean>;

/** 按字符顺序比较字符串 */
export function compareStrings(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** 汉字转换为拼音 */
export function toPinyin(str: string) {
  const strings = pinyin(str.replace(/[\s]+/g, '-'), {
    type: 'array',
    toneType: 'num',
    nonZh: 'consecutive',
  });

  return strings
    .join('-')
    .replace(/[\uff00-\uffe5·]/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/g, '')
    .toLowerCase();
}

export function parseQuery(input: string) {
  const [base, rawQuery] = input.split('?');
  const searchParams = new URLSearchParams(rawQuery);
  const query: Query = {};

  searchParams.forEach((value, key) => {
    if (value.length === 0 || value === 'true') {
      query[key] = true;
    }
    else if (value === 'false') {
      query[key] = false;
    }
    else {
      query[key] = value;
    }
  });

  return {
    base,
    rawQuery,
    query,
  };
}
