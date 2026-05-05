import { DarkMode } from './constant';
import { createStyles, type Styles, type JssStyle } from './styles';

/**
 * 将 token 名包裹为 CSS 自定义属性引用。
 *
 * @example
 * ```ts
 * cssVar('--emphasis-underline')
 * // => 'var(--emphasis-underline)'
 * ```
 */
function cssVar(name: string): string {
  return `var(${name})`;
}

/**
 * 创建一对 token 常量
 *
 * @description
 * 返回 `[token, value]` 元组，token 为裸 CSS 变量名，value 为 `var()` 引用。
 *
 * @example
 * ```ts
 * const [UnderlineToken, Underline] = createToken('emphasis-underline');
 * // UnderlineToken → '--emphasis-underline'
 * // Underline       → 'var(--emphasis-underline)'
 * ```
 */
export function createToken(name: string): readonly [token: string, value: string] {
  const token = `--${name}`;
  return [token, cssVar(token)] as const;
}

/** 单 Token 主题定义 */
interface TokenDef {
  light: string;
  dark?: string;
}

/**
 * 定义 CSS 变量映射
 *
 * @description
 * 底层函数，输入 token 定义，输出 `{ light, dark }` 两套 CSS 变量对象。
 * 不涉及 JSS 注入，调用方自行决定如何使用。一般直接用封装后的 {@link createThemeStylesByVars}。
 */
export function defineVars(
  def: Record<string, TokenDef>,
): { light: Styles; dark: Styles } {
  const light: Styles = {};
  const dark: Styles = {};

  for (const [token, values] of Object.entries(def)) {
    light[token] = values.light;

    if (values.dark) {
      dark[token] = values.dark;
    }
  }

  return { light, dark };
}

/**
 * 创建主题样式
 *
 * @description 屏蔽主题样式设置细节，主要是在自定义的情况下使用，使用时直接在对应选择器展开即可。
 *
 * @example
 * ```ts
 * export default createStyles({
 *   toContent: {
 *     ...createThemeStyles({
 *       light: {
 *         body: { backgroundImage: "url('./bg.svg')" },
 *       },
 *       dark: {
 *         body: { backgroundImage: 'none' },
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function createThemeStyles(def: {
  light: Styles;
  dark: Styles;
}): Styles {
  return {
    ...def.light,
    [DarkMode]: {
      ...def.dark,
    },
  };
}

/**
 * 通过 CSS 变量创建主题样式
 *
 * @description
 * 输入 token 定义，自动完成：token 定义 → CSS 变量映射 → JSS `@global` 注入。
 * 返回值可直接与组件其他 `createStyles` 通过 `mergeStyles` 合并。
 *
 * @example
 * ```ts
 * import { gray, createToken, createThemeStylesByVars } from '@blog/styles';
 *
 * const [UnderlineToken, Underline] = createToken('emphasis-underline');
 *
 * const themeStyles = createThemeStylesByVars({
 *   [UnderlineToken]: {
 *     light: `linear-gradient(..., ${gray[400]} 0px, ...)`,
 *     dark:  `linear-gradient(..., ${gray[300]} 0px, ...)`,
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
