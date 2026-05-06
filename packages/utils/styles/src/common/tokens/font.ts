import { cssVar } from '../theme';

/** @see {@link FontBody} */
export const FontBodyToken = '--font-body';
/**
 * 正文字体
 *
 * @description 黑体字。
 */
export const FontBody = cssVar(FontBodyToken);

/** @see {@link FontHeading} */
export const FontHeadingToken = '--font-heading';
/**
 * 标题字体
 *
 * @description 衬线字体。
 */
export const FontHeading = cssVar(FontHeadingToken);

/** @see {@link FontCode} */
export const FontCodeToken = '--font-code';
/**
 * 等宽字体
 *
 * @description 行内代码、代码块时用的字体
 */
export const FontCode = cssVar(FontCodeToken);
