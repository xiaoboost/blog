import jss from 'jss';
import preset from 'jss-preset-default';

import { Styles, StyleSheet, JssStyle } from 'jss';

jss.setup(preset());

export function createStyles<
  C extends string = string,
>(styles: Styles<C>): Pick<StyleSheet<C>, 'classes' | 'toString'> {
  return jss.createStyleSheet(styles as any, {
    link: true,
  }).attach();
}

export function createGlobalStyles(styles: JssStyle) {
  const rules = createStyles({
    '@global': styles,
  });

  return rules.toString();
}

export function createMediaStyles() {
  // ..
}

export function createScrollbarWidth() {
  // ..
}
