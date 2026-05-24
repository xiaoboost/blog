import { cssVar } from '../theme';

/** @see {@link TextPrimary} */
export const TextPrimaryToken = '--color-text-primary';
/**
 * 主文字色
 *
 * @description
 * 正文、标题、导航高亮。
 */
export const TextPrimary = cssVar(TextPrimaryToken);

/** @see {@link TextSecondary} */
export const TextSecondaryToken = '--color-text-secondary';
/**
 * 次要文字色
 *
 * @description
 * 图片 alt、滚动条滑块、锚点链接。
 */
export const TextSecondary = cssVar(TextSecondaryToken);

/** @see {@link TextTertiary} */
export const TextTertiaryToken = '--color-text-tertiary';
/**
 * 辅助文字色
 *
 * @description
 * 标签、页脚、辅助说明、装饰线。
 */
export const TextTertiary = cssVar(TextTertiaryToken);
