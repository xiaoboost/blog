import Jss from 'jss';
import preset from 'jss-preset-default';

Jss.setup(preset());

const JssKey = '_JSS';

declare const _JSS: typeof Jss;

/** 缓存变量上下文 */
export const StyleContext = {
  [JssKey]: Jss,
};

/** Jss 构造器 */
export const jss = _JSS;
