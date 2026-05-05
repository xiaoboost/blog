import {
  Gray,
  Blue,
  Red,
  TextPrimaryToken,
  TextSecondaryToken,
  TextTertiaryToken,
  BgPrimaryToken,
  BgSecondaryToken,
  BorderPrimaryToken,
  AccentPrimaryToken,
  ShadowCardToken,
  ShadowControlToken,
  FontBodyToken,
  FontHeadingToken,
  FontCodeToken,
  WidthMainToken,
  FontSizeBaseToken,
  RadiusSmToken,
  RadiusMdToken,
  RadiusLgToken,
  createToken,
  createThemeStylesByVars,
  FontDefault,
  FontSerif,
  FontMono,
  mainWidth,
  FontDefaultSize,
  headerBodyMargin,
} from '@blog/styles';

// ─── Layout 私有 token ────────────────────────────────────

export const [LinkDefaultToken, LinkDefault] = createToken('link-default');
export const [LinkHoverToken, LinkHover] = createToken('link-hover');
export const [AccentDangerToken, AccentDanger] = createToken('accent-danger');
export const [SelectionTextToken, SelectionText] = createToken('selection-text');
export const [SelectionBgToken, SelectionBg] = createToken('selection-bg');
export const [ShadowHeaderToken, ShadowHeader] = createToken('shadow-header');
export const [SpacingHeaderBodyToken, SpacingHeaderBody] = createToken('spacing-header-body');

// ─── 派生色 ───────────────────────────────────────────────

/** 链接基准色 */
const linkBase = Blue[500].mix(Gray[700], 0.35);

// ─── 主题定义 ─────────────────────────────────────────────

/**
 * 全局 + layout 私有 token 的亮 / 暗映射。
 *
 * @remarks
 * 字体与尺寸在两端保持不变，但仍通过 CSS 变量引用，方便未来配置。
 * 阴影在暗色模式下提高不透明度以保证可见性。
 */
export default createThemeStylesByVars({
  // ═══════════════════════════════════════════════════════
  // 文本
  // ═══════════════════════════════════════════════════════
  [TextPrimaryToken]: {
    light: Gray[700].toString(),
    dark: Gray[100].toString(),
  },
  [TextSecondaryToken]: {
    light: Gray[500].toString(),
    dark: Gray[300].toString(),
  },
  [TextTertiaryToken]: {
    light: Gray[400].toString(),
    dark: Gray[500].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 背景
  // ═══════════════════════════════════════════════════════
  [BgPrimaryToken]: {
    light: Gray[0].toString(),
    dark: Gray[900].toString(),
  },
  [BgSecondaryToken]: {
    light: Gray[50].toString(),
    dark: Gray[800].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 边框
  // ═══════════════════════════════════════════════════════
  [BorderPrimaryToken]: {
    light: Gray[200].toString(),
    dark: Gray[700].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 强调
  // ═══════════════════════════════════════════════════════
  [AccentPrimaryToken]: {
    light: Blue[500].toString(),
    dark: Blue[300].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 阴影
  // ═══════════════════════════════════════════════════════
  [ShadowCardToken]: {
    light: [
      `0 2px 6px ${Gray[950].alpha(0.06)}`,
      `0 1px 2px ${Gray[950].alpha(0.08)}`,
    ].join(', '),
    dark: [
      `0 2px 6px ${Gray[950].alpha(0.3)}`,
      `0 1px 2px ${Gray[950].alpha(0.35)}`,
    ].join(', '),
  },
  [ShadowControlToken]: {
    light: `0 1px 3px ${Gray[300]}`,
    dark: `0 1px 3px ${Gray[950].alpha(0.3)}`,
  },

  // ═══════════════════════════════════════════════════════
  // 排版
  // ═══════════════════════════════════════════════════════
  [FontBodyToken]: {
    light: FontDefault,
  },
  [FontHeadingToken]: {
    light: FontSerif,
  },
  [FontCodeToken]: {
    light: FontMono,
  },

  // ═══════════════════════════════════════════════════════
  // 尺寸
  // ═══════════════════════════════════════════════════════
  [WidthMainToken]: {
    light: `${mainWidth}px`,
  },
  [FontSizeBaseToken]: {
    light: `${FontDefaultSize}px`,
  },

  // 圆角
  [RadiusSmToken]: {
    light: '4px',
  },
  [RadiusMdToken]: {
    light: '8px',
  },
  [RadiusLgToken]: {
    light: '16px',
  },

  // Layout 私有
  // ═══════════════════════════════════════════════════════
  // 链接
  // ═══════════════════════════════════════════════════════
  [LinkDefaultToken]: {
    light: linkBase.alpha(0.6).toString(),
    dark: Blue[300].alpha(0.7).toString(),
  },
  [LinkHoverToken]: {
    light: linkBase.toString(),
    dark: Blue[200].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 强调
  // ═══════════════════════════════════════════════════════
  [AccentDangerToken]: {
    light: Red[300].toString(),
    dark: Red[200].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 选中
  // ═══════════════════════════════════════════════════════
  [SelectionTextToken]: {
    light: Gray[100].toString(),
    dark: Gray[700].toString(),
  },
  [SelectionBgToken]: {
    light: Gray[700].toString(),
    dark: Gray[100].toString(),
  },

  // ═══════════════════════════════════════════════════════
  // 阴影
  // ═══════════════════════════════════════════════════════
  [ShadowHeaderToken]: {
    light: [
      `0 1px 3px ${Gray[950].alpha(0.08)}`,
      `0 1px 1px ${Gray[950].alpha(0.04)}`,
    ].join(', '),
    dark: [
      `0 1px 3px ${Gray[950].alpha(0.3)}`,
      `0 1px 1px ${Gray[950].alpha(0.2)}`,
    ].join(', '),
  },

  // ═══════════════════════════════════════════════════════
  // 间距
  // ═══════════════════════════════════════════════════════
  [SpacingHeaderBodyToken]: {
    light: `${headerBodyMargin}px`,
  },
});
