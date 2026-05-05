/**
 * 将 token 名包裹为 CSS 自定义属性引用。
 */
function cssVar(token: string): string {
  return `var(${token})`;
}

// ═══════════════════════════════════════════════════════════
// 文本色
// ═══════════════════════════════════════════════════════════

/**
 * 主文字色
 *
 * @description
 * 正文、标题、导航高亮。跨 layout / post / blur-reveal 使用。
 * 亮色模式映射至 `gray[700]`（原 `Black`）。
 */
export const TextPrimaryToken = '--color-text-primary';
export const TextPrimary = cssVar(TextPrimaryToken);

/**
 * 次要文字色
 *
 * @description
 * 图片 alt、滚动条滑块、锚点链接。跨 layout / post / text-gloss 使用。
 * 亮色模式映射至 `gray[500]`（原 `BlackLight`）。
 */
export const TextSecondaryToken = '--color-text-secondary';
export const TextSecondary = cssVar(TextSecondaryToken);

/**
 * 辅助文字色
 *
 * @description
 * 标签、页脚、辅助说明、装饰线。跨 layout / post / text-gloss 使用。
 * 亮色模式映射至 `gray[400]`（原 `BlackLighter`）。
 */
export const TextTertiaryToken = '--color-text-tertiary';
export const TextTertiary = cssVar(TextTertiaryToken);

// ═══════════════════════════════════════════════════════════
// 背景色
// ═══════════════════════════════════════════════════════════

/**
 * 主背景色
 *
 * @description
 * 页面主体
 */
export const BgPrimaryToken = '--color-bg-primary';
export const BgPrimary = cssVar(BgPrimaryToken);

/**
 * 次级背景色
 *
 * @description
 * 次级背景色，主要用于卡片等视图。
 */
export const BgSecondaryToken = '--color-bg-secondary';
export const BgSecondary = cssVar(BgSecondaryToken);

// ═══════════════════════════════════════════════════════════
// 边框
// ═══════════════════════════════════════════════════════════

/**
 * 主分割线 / 边框色
 *
 * @description
 * 列表分割线、hr、表格单元格边框。
 */
export const BorderPrimaryToken = '--color-border-primary';
export const BorderPrimary = cssVar(BorderPrimaryToken);

// ═══════════════════════════════════════════════════════════
// 强调色
// ═══════════════════════════════════════════════════════════

/**
 * 主强调色
 *
 * @description
 * 链接色等跨包场景。
 */
export const AccentPrimaryToken = '--color-accent-primary';
export const AccentPrimary = cssVar(AccentPrimaryToken);

// ═══════════════════════════════════════════════════════════
// 阴影
// ═══════════════════════════════════════════════════════════

/**
 * 卡片级阴影
 *
 * @description
 * 用于文章卡片、文章列表等大容器
 */
export const ShadowCardToken = '--shadow-card';
export const ShadowCard = cssVar(ShadowCardToken);

// ═══════════════════════════════════════════════════════════
// 排版
// ═══════════════════════════════════════════════════════════

/**
 * 正文字体
 *
 * @description 黑体字。
 */
export const FontBodyToken = '--font-body';
export const FontBody = cssVar(FontBodyToken);

/**
 * 标题字体
 *
 * @description 衬线字体。
 */
export const FontHeadingToken = '--font-heading';
export const FontHeading = cssVar(FontHeadingToken);

/**
 * 等宽字体
 *
 * @description 行内代码、代码块时用的字体
 */
export const FontCodeToken = '--font-code';
export const FontCode = cssVar(FontCodeToken);

// ═══════════════════════════════════════════════════════════
// 尺寸
// ═══════════════════════════════════════════════════════════

/**
 * 主内容区宽度
 *
 * @description 主内容宽度，也用来作为响应式变化的宽度界限。
 */
export const WidthMainToken = '--width-main';
export const WidthMain = cssVar(WidthMainToken);

/**
 * 基准字号
 *
 * @description 正文的主字体大小。
 */
export const FontSizeBaseToken = '--font-size-base';
export const FontSizeBase = cssVar(FontSizeBaseToken);

/**
 * 小号圆角
 *
 * @description
 * 用于行内代码、标签等小型元素。
 */
export const RadiusSmToken = '--radius-small';
export const RadiusSm = cssVar(RadiusSmToken);

/**
 * 中号圆角
 *
 * @description
 * 用于卡片、按钮等中型容器。
 */
export const RadiusMdToken = '--radius-middle';
export const RadiusMd = cssVar(RadiusMdToken);

/**
 * 大号圆角
 *
 * @description
 * 用于弹窗、大面板等大型容器。
 */
export const RadiusLgToken = '--radius-large';
export const RadiusLg = cssVar(RadiusLgToken);
