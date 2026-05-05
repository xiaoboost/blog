import { defineVars, type TokenDef } from '../common/theme';
import { createStyles, type JssStyle } from './styles';

/**
 * 通过 CSS 变量创建主题样式
 *
 * @description
 * 输入 token 定义，自动完成：token 定义 → CSS 变量映射 → JSS `@global` 注入。
 * 返回值可直接与组件其他 `createStyles` 通过 `mergeStyles` 合并。
 *
 * @example
 * ```ts
 * import { Gray } from '@blog/styles/compile';
 * import { createToken } from '@blog/styles/common';
 *
 * const [UnderlineToken, Underline] = createToken('emphasis-underline');
 *
 * const themeStyles = createThemeStylesByVars({
 *   [UnderlineToken]: {
 *     light: `linear-gradient(..., ${Gray[400]} 0px, ...)`,
 *     dark:  `linear-gradient(..., ${Gray[300]} 0px, ...)`,
 *   },
 * });
 *
 * export default mergeStyles(themeStyles, myStyles);
 * ```
 */
export function createThemeStylesByVars(def: Record<string, TokenDef>): JssStyle {
  const { light, dark } = defineVars(def);
  return createStyles({
    '@global': {
      ':root': light,
      '@media (prefers-color-scheme: dark)': {
        ':root': dark,
      },
    },
  });
}
