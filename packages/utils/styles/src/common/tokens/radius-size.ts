import { cssVar } from '../theme';

/** @see {@link RadiusSm} */
export const RadiusSmToken = '--radius-small';
/**
 * 小号圆角 — 2px
 *
 * @description 用于行内代码、标签等小型元素。
 */
export const RadiusSm = cssVar(RadiusSmToken);

/** @see {@link RadiusMd} */
export const RadiusMdToken = '--radius-middle';
/**
 * 中号圆角 — 4px
 *
 * @description 用于卡片、按钮等中型容器。
 */
export const RadiusMd = cssVar(RadiusMdToken);

/** @see {@link RadiusLg} */
export const RadiusLgToken = '--radius-large';
/**
 * 大号圆角 — 8px
 *
 * @description 用于弹窗、大面板等大型容器。
 */
export const RadiusLg = cssVar(RadiusLgToken);
