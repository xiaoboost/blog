import jss from 'jss';
import preset from 'jss-preset-default';

import { Styles, StyleSheet } from 'jss';
import { hyphenate } from '@xiao-ai/utils';
import { mediaPhone, mediaPc } from './constant';

export { jss };
export * from 'jss';

jss.setup(preset());

export function createStyles<C extends string = string>(
  styles: Styles<C>
): StyleSheet<C> {
  return jss.createStyleSheet(styles, {
    link: false,
    index: 0,
    generateId: (rule) => {
      return typeof rule.key === 'string' ? hyphenate(rule.key ?? '') : '';
    },
  });
}

export function setScrollbarWidth(width: number, selector = '@global') {
  const prefix = selector === '@global' ? '' : '&';

  return createStyles({
    [selector]: {
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
    },
  });
}

export function createFontFaceStyles(
  family: string,
  style: string,
  weight: string,
  url: string
) {
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

export function mergeStyles(...styles: StyleSheet[]): StyleSheet {
  const style = createStyles({});

  for (const data of styles) {
    (style as any).rules.index.push(...(data as any).rules.index);
  }

  return style;
}

export function createMediaStyles<T>(
  pcParam: T,
  phoneParam: T,
  template: (param: T) => Styles,
) {
  return {
    [mediaPc]: template(pcParam),
    [mediaPhone]: template(phoneParam),
  };
}
