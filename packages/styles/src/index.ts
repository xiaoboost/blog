import jss from 'jss';
import nested from 'jss-plugin-nested';
import extend from 'jss-plugin-extend';
import expand from 'jss-plugin-expand';
import camelCase from 'jss-plugin-camel-case';
import defaultUnit from 'jss-plugin-default-unit';

import { Styles, StyleSheet } from 'jss';

jss
  .use(nested())
  .use(extend())
  .use(expand())
  .use(camelCase())
  .use(defaultUnit());

export function createStyles<
  C extends string = string,
  Props = unknown,
>(styles: Styles<C, Props>): Pick<StyleSheet<C>, 'classes' | 'toString'> {
  return jss.createStyleSheet(styles as any, {
    link: true,
  }).attach();
}
