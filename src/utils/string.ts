import pinyin from 'pinyin';

import { concat } from './array';

export const toPinyin = (str: string) => {
    const str1 = str
        .replace(/([a-zA-Z0-9]+)/g, '-$1-')
        .replace(/[ -]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return concat(pinyin(str1, { style: pinyin.STYLE_NORMAL }), (arr) => arr).join('');
};
