import jss from 'jss';
import preset from 'jss-preset-default';

import { Styles, StyleSheet } from 'jss';
import { hyphenate } from '@xiao-ai/utils';

export { jss };
export * from 'jss';

jss.setup(preset());

export function createStyles<
  C extends string = string,
>(styles: Styles<C>): Pick<StyleSheet<C>, 'classes' | 'toString'> {
  return jss.createStyleSheet(styles, {
    link: false,
    index: 0,
    generateId: (rule) => hyphenate(rule.key),
  });
}

export function createCssCode(styles: Styles): string {
  return createStyles(styles).toString();
}
