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
 * 页面主体、卡片容器。跨 layout / post / blur-reveal 使用。
 * 亮色模式映射至 `gray[0]`（原 `White`）。
 */
export const BgPrimaryToken = '--color-bg-primary';
export const BgPrimary = cssVar(BgPrimaryToken);

/**
 * 次级背景色
 *
 * @description
 * 引用块、滚动条轨道。跨 layout / post 使用。
 * 亮色模式映射至 `gray[50]`（原 `WhiteBg`）。
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
 * 列表分割线、hr、表格单元格边框。跨 layout / post / text-gloss 使用。
 * 合并了原 `Gray`、`tableBorderColor`、`tableHeaderBorderColor`。
 * 亮色模式映射至 `gray[200]`。
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
 * 当前文章内未直接使用，预留给暗色模式链接色等跨包场景。
 * 亮色模式映射至 `blue[500]`（原 `Blue`）。
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
 * 用于文章卡片、文章列表等大容器。跨 layout / post 使用。
 *
 * @remarks
 * 亮色模式：`0 2px 6px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08)`
 */
export const ShadowCardToken = '--shadow-card';
export const ShadowCard = cssVar(ShadowCardToken);

/**
 * 小控件阴影
 *
 * @description
 * 用于分页按钮、TOC 浮窗等小型控件。跨 layout / post 使用。
 *
 * @remarks
 * 亮色模式：`0 1px 3px gray[300]`（原 `Shadow`）
 */
export const ShadowControlToken = '--shadow-control';
export const ShadowControl = cssVar(ShadowControlToken);

// ═══════════════════════════════════════════════════════════
// 排版
// ═══════════════════════════════════════════════════════════

/**
 * 正文字体
 *
 * @description
 * 跨 layout / post 使用。亮色模式映射至 `FontDefault`。
 */
export const FontBodyToken = '--font-body';
export const FontBody = cssVar(FontBodyToken);

/**
 * 标题字体
 *
 * @description
 * 跨 layout / post 使用。亮色模式映射至 `FontSerif`。
 */
export const FontHeadingToken = '--font-heading';
export const FontHeading = cssVar(FontHeadingToken);

/**
 * 等宽字体
 *
 * @description
 * 跨 layout / post / code-block-normal 使用。亮色模式映射至 `FontMono`。
 */
export const FontCodeToken = '--font-code';
export const FontCode = cssVar(FontCodeToken);

// ═══════════════════════════════════════════════════════════
// 尺寸
// ═══════════════════════════════════════════════════════════

/**
 * 主内容区宽度
 *
 * @description
 * 亮色模式映射至 `mainWidth`（`900px`）。
 */
export const WidthMainToken = '--width-main';
export const WidthMain = cssVar(WidthMainToken);

/**
 * 基准字号
 *
 * @description
 * 亮色模式映射至 `FontDefaultSize`（`14px`）。
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
