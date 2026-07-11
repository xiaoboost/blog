import type { Properties as CssProperties } from 'csstype';

// ═══════════════════════════════════════════════════════════════
// 基础值类型
// ═══════════════════════════════════════════════════════════════

/** CSS 属性值 */
export type StyleValue = string | number | Array<string | number>;

// ═══════════════════════════════════════════════════════════════
// 单条样式规则
// ═══════════════════════════════════════════════════════════════

/**
 * 单条样式规则。
 *
 * csstype 标准属性 autocomplete +
 * 以 StyleValue 作为泛型参数，使 padding: [10, 24]、marginLeft: 8 等合法 +
 * 通用字符串索引覆盖 `&` 嵌套、`@`-规则、自定义属性。
 */
export type StyleRule = CssProperties<StyleValue> & {
  [key: string]: StyleValue | StyleRule | undefined;
};

// ═══════════════════════════════════════════════════════════════
// 顶层样式表
// ═══════════════════════════════════════════════════════════════

/**
 * 一组样式规则。
 *
 * Key 为 class 名（或 `@global`、`@import` 等 @-规则名）。
 * Value 可为 StyleRule（标准样式）或 string（用于 `@import` 等）。
 */
export type Styles<C extends string = string> = Record<C, StyleRule | string>;

// ═══════════════════════════════════════════════════════════════
// 编译结果
// ═══════════════════════════════════════════════════════════════

/**
 * 编译产物。
 *
 * - `classes`: class 原名 → 含 hash 的类名。组件通过 `styles.classes.xxx` 引用。
 * - `toString()`: 完整 CSS 字符串。
 */
export interface StyleSheet<C extends string = string> {
  /** class 原名 → hashed 类名的映射 */
  classes: Record<C, string>;
  /** 序列化为 CSS 字符串 */
  toString(): string;
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

/**
 * 编译样式对象 → StyleSheet。
 *
 * @todo 待实现
 */
export function createStyles<C extends string>(styles: Styles<C>): StyleSheet<C> {
  throw new Error('[styles] createStyles not implemented yet');
}

/**
 * 合并多个 StyleSheet。
 *
 * @todo 待实现
 */
export function mergeStyles(...sheets: StyleSheet[]): StyleSheet {
  throw new Error('[styles] mergeStyles not implemented yet');
}

/**
 * 创建 @font-face 规则。
 *
 * @todo 待实现
 */
export function createFontFaceStyles(
  _family: string,
  _style: string,
  _weight: string,
  _url: string,
): StyleSheet {
  throw new Error('[styles] createFontFaceStyles not implemented yet');
}
