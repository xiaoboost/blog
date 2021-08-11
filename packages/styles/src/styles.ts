import jss from 'jss';
import preset from 'jss-preset-default';

import { Styles, StyleSheet } from 'jss';
import { hyphenate } from '@xiao-ai/utils';

export { jss };
export * from 'jss';

jss.setup(preset());

export function createStyles<
  C extends string = string,
>(styles: Styles<C>): StyleSheet<C> {
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

export function addGlobalRule(add: StyleSheet, added: StyleSheet) {
  (add as any).rules.index.push(added.getRule('@global'));
  return add;
}
