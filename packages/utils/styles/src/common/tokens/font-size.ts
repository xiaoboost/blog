import { cssVar } from '../theme';

/** @see {@link WidthMain} */
export const WidthMainToken = '--width-main';
/**
 * 主内容区宽度
 *
 * @description 主内容宽度，也用来作为响应式变化的宽度界限。
 */
export const WidthMain = cssVar(WidthMainToken);

// ═══════════════════════════════════════════════════════════
// 字号
// ═══════════════════════════════════════════════════════════

/** @see {@link FontSizeSm} */
export const FontSizeSmToken = '--font-size-sm';
/**
 * 小号字号 — 12px
 *
 * @description 用于辅助文字、标签等。
 */
export const FontSizeSm = cssVar(FontSizeSmToken);

/** @see {@link FontSizeRegular} */
export const FontSizeRegularToken = '--font-size-regular';
/**
 * 常规字号 — 14px
 *
 * @description 全局基准字号。
 */
export const FontSizeRegular = cssVar(FontSizeRegularToken);

/** @see {@link FontSizeMd} */
export const FontSizeMdToken = '--font-size-md';
/**
 * 中号字号 — 16px
 *
 * @description 全局正文字号。
 */
export const FontSizeMd = cssVar(FontSizeMdToken);

/** @see {@link FontSizeLg} */
export const FontSizeLgToken = '--font-size-lg';
/**
 * 大号字号 — 20px
 */
export const FontSizeLg = cssVar(FontSizeLgToken);

/** @see {@link FontSizeXl} */
export const FontSizeXlToken = '--font-size-xl';
/**
 * 特大号字号 — 24px
 */
export const FontSizeXl = cssVar(FontSizeXlToken);

/** @see {@link FontSizeXxl} */
export const FontSizeXxlToken = '--font-size-xxl';
/**
 * 超大号字号 — 28px
 */
export const FontSizeXxl = cssVar(FontSizeXxlToken);
