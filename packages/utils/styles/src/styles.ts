import type jssx from 'jss';
import type { default as Jss, Styles, StyleSheet } from 'jss';

import { hyphenate } from '@xiao-ai/utils';
import { mediaPhone, mediaPc } from './constant';

export { jssx as jss };

/** 外部注入虚拟 jss 变量 */
declare const jss: typeof Jss;

type JssStyle<C extends string | number = string> = Pick<StyleSheet<C>, 'classes'>;

export { JssStyle, Styles };

export function createStyles<C extends string = string>(styles: Styles<C>): JssStyle<C> {
  return jss.createStyleSheet(styles, {
    link: false,
    index: 0,
    generateId: (rule) => {
      return typeof rule.key === 'string' ? hyphenate(rule.key ?? '') : '';
    },
  });
}

export function createScrollbarWidth(width: number, prefix = ''): Styles {
  return {
    [`${prefix}::-webkit-scrollbar`]: {
      width,
      height: width,
    },
    [`${prefix}::-webkit-scrollbar-track`]: {
      boxShadow: `inset 0 0 ${width / 2}px rgba(0, 0, 0, .3)`,
    },
    [`${prefix}::-webkit-scrollbar-thumb`]: {
      boxShadow: `inset 0 0 ${width / 2}px rgba(0, 0, 0, .3)`,
    },
  };
}

export function createFontFaceStyles(
  family: string,
  style: string,
  weight: string,
  url: string,
): JssStyle {
  return createStyles({
    '@font-face': {
      fontFamily: family,
      fontStyle: style,
      fontWeight: weight,
      src: `
        url('${url}.woff2') format('woff2'),
        url('${url}.woff') format('woff'),
        url('${url}.ttf') format('truetype')
      `.trim(),
    },
  });
}

export function mergeStyles(...styles: JssStyle[]): JssStyle {
  const style = createStyles({});

  for (const data of styles) {
    (style as any).rules.index.push(...(data as any).rules.index);
  }

  return style;
}

export function createMediaStyles<T>(pcParam: T, phoneParam: T, template: (param: T) => Styles) {
  return {
    [mediaPc]: template(pcParam),
    [mediaPhone]: template(phoneParam),
  };
}

/** 迭代标题元素 */
export function createHeadStyles(pre = '', cb: (level: number) => Styles) {
  const styles: Styles = {};

  for (let i = 1; i < 6; i++) {
    styles[`${pre}h${i}`] = cb(i);
  }

  return styles;
}
