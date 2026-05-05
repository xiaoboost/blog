import type { Styles } from '@blog/context/runtime';
import { DarkMode } from './constant';

/**
 * 将 token 名包裹为 CSS 自定义属性引用。
 *
 * @example
 * ```ts
 * cssVar('--emphasis-underline')
 * // => 'var(--emphasis-underline)'
 * ```
 */
export function cssVar(name: string): string {
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
export interface TokenDef {
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
 * 创建主题样式（不含 CSS 变量注入）
 *
 * @description 屏蔽主题样式设置细节，主要是纯对象拼接，不依赖 JSS 运行时。
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
