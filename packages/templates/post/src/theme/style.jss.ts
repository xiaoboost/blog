import {
  Gray,
  Blue,
  Yellow,
  FontDefault,
  CustomFont,
  createThemeStylesByVars,
} from '@blog/styles/compile';
import {
  TextQuaternaryToken,
  BgTertiaryToken,
  BlockquoteBgToken,
  BgCodeToken,
  AccentLightToken,
  CodeUnderlineToken,
  TocShadowToken,
  FontEmToken,
  EmphasisUnderlineToken,
  EmphasisShadowToken,
  EmphasisStrongBgToken,
  EmphasisStrongShadowToken,
} from './token';

// ─── 派生色 ───────────────────────────────────────────────

/** em 镂空阴影中硬编码的 #fafafa（白光），用 Gray[0] 近似 */
const emShadowLightBase = Gray[0];

// ─── 主题定义 ─────────────────────────────────────────────

export default createThemeStylesByVars({
  // 文本
  [TextQuaternaryToken]: {
    light: Gray[300].toString(),
    dark: Gray[600].toString(),
  },

  // 背景
  [BgTertiaryToken]: {
    light: Gray[100].toString(),
    dark: Gray[800].toString(),
  },
  [BgCodeToken]: {
    light: Yellow[100].toString(),
    dark: Yellow[100].mix(Gray[900], 0.85).toString(),
  },
  [BlockquoteBgToken]: {
    light: Gray[50].toString(),
    dark: Gray[700].alpha(0.5).toString(),
  },

  // 强调
  [AccentLightToken]: {
    light: Blue[300].toString(),
    dark: Blue[200].toString(),
  },

  // 代码
  [CodeUnderlineToken]: {
    light: Yellow[200].toString(),
    dark: Yellow[500].toString(),
  },

  // TOC 阴影
  [TocShadowToken]: {
    light: `0 1px 3px ${Gray[300]}`,
    dark: `0 1px 3px ${Gray[950].alpha(0.3)}`,
  },

  // 排版
  [FontEmToken]: {
    light: `${CustomFont.EMLora}, ${FontDefault}`,
  },

  // em 强调 — 下划线
  [EmphasisUnderlineToken]: {
    light: [
      'linear-gradient(',
      'to top,',
      'transparent,',
      'transparent 0px,',
      `${Gray[400]} 0px,`,
      `${Gray[400]} 1px,`,
      'transparent 1px',
      ')',
    ].join(' '),
    dark: [
      'linear-gradient(',
      'to top,',
      'transparent,',
      'transparent 0px,',
      `${Gray[600]} 0px,`,
      `${Gray[600]} 1px,`,
      'transparent 1px',
      ')',
    ].join(' '),
  },

  // em 强调 — 镂空阴影
  [EmphasisShadowToken]: {
    light: [
      `-1px -1px 0 ${emShadowLightBase},`,
      `1px -1px 0 ${Gray[50]},`,
      `-1px 1px 0 ${Gray[50]},`,
      `1px 1px ${Gray[50]}`,
    ].join(' '),
    dark: 'none',
  },

  // em > strong — 填充背景
  [EmphasisStrongBgToken]: {
    light: `linear-gradient(120deg, ${Gray[200]} 0%, ${Gray[200]} 100%)`,
    dark: `linear-gradient(120deg, ${Gray[600]} 0%, ${Gray[600]} 100%)`,
  },

  // em > strong — 镂空阴影
  [EmphasisStrongShadowToken]: {
    light: [
      `-0.8px -0.8px 0 ${emShadowLightBase},`,
      `0.8px -0.8px 0 ${Gray[50]},`,
      `-0.8px 0.8px 0 ${Gray[50]},`,
      `0.8px 0.8px ${Gray[50]}`,
    ].join(' '),
    dark: 'none',
  },
});
