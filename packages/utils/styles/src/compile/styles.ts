import { type StyleSheet, type Styles, jss } from '@blog/context/runtime';
import { hyphenate } from '@xiao-ai/utils';

export { type StyleSheet, type Styles } from '@blog/context/runtime';
export type JssStyle<C extends string | number = string> = Pick<StyleSheet<C>, 'classes'>;

export function createStyles<C extends string = string>(styles: Styles<C>): JssStyle<C> {
  return jss.createStyleSheet(styles, {
    link: false,
    index: 0,
    generateId: (rule: any) => {
      return typeof rule.key === 'string' ? hyphenate(rule.key ?? '') : '';
    },
  });
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
      src: `url('${url}.woff2') format('woff2')`,
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
