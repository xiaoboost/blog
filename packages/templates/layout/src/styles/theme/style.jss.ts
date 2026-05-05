import {
  TextPrimaryToken,
  TextSecondaryToken,
  TextTertiaryToken,
  BgPrimaryToken,
  BgSecondaryToken,
  BorderPrimaryToken,
  AccentPrimaryToken,
  ShadowCardToken,
  FontBodyToken,
  FontHeadingToken,
  FontCodeToken,
  WidthMainToken,
  FontSizeBaseToken,
  RadiusSmToken,
  RadiusMdToken,
  RadiusLgToken,
  FontDefault,
  FontSerif,
  FontMono,
  mainWidth,
  FontDefaultSize,
  headerBodyMargin,
} from '@blog/styles/common';
import { Gray, Blue, Red, createThemeStylesByVars } from '@blog/styles/compile';
import {
  LinkDefaultToken,
  LinkHoverToken,
  AccentDangerToken,
  SelectionTextToken,
  SelectionBgToken,
  ShadowHeaderToken,
  GotoTopShadowToken,
  PaginationShadowToken,
  SpacingHeaderBodyToken,
} from './token';

// ─── 派生色 ───────────────────────────────────────────────

/** 链接基准色 */
const linkBase = Blue[500].mix(Gray[700], 0.35);

// ─── 主题定义 ─────────────────────────────────────────────

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
    light: Gray[0].toString(),
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
  [PaginationShadowToken]: {
    light: `0 1px 3px ${Gray[300]}`,
    dark: 'none',
  },
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

  [GotoTopShadowToken]: {
    light: `0 0px 5px ${Gray[500]}`,
    dark: 'none',
  },

  // ═══════════════════════════════════════════════════════
  // 间距
  // ═══════════════════════════════════════════════════════
  [SpacingHeaderBodyToken]: {
    light: `${headerBodyMargin}px`,
  },
});
