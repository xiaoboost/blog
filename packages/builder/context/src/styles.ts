import type Jss from 'jss';

export const JssKey = '_JSS';

/** 虚拟 jss 变量 */
declare const _JSS: typeof Jss;

export const jss = _JSS;
