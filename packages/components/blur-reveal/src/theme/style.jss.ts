import {
  Gray,
  BgSecondary,
  createThemeStylesByVars,
  colorAlpha,
} from '@blog/styles/compile';
import {
  FogGradientLeftToken,
  FogGradientRightToken,
  OverlayGradientToken,
  BlurBtnBgToken,
  BlurBtnShadowToken,
  BlurBtnHoverShadowToken,
  BlurBtnBorderToken,
} from './token';

export default createThemeStylesByVars({
  [FogGradientLeftToken]: {
    light: `linear-gradient(to right, ${BgSecondary} 25%, transparent 100%)`,
    dark: `linear-gradient(to right, ${BgSecondary} 25%, transparent 100%)`,
  },
  [FogGradientRightToken]: {
    light: `linear-gradient(to left, ${BgSecondary} 25%, transparent 100%)`,
    dark: `linear-gradient(to left, ${BgSecondary} 25%, transparent 100%)`,
  },
  [OverlayGradientToken]: {
    light: `linear-gradient(to bottom, transparent 30%, ${colorAlpha(BgSecondary, 0.8)} 70%, ${BgSecondary} 100%)`,
    dark: `linear-gradient(to bottom, transparent 30%, ${colorAlpha(BgSecondary, 0.8)} 70%, ${BgSecondary} 100%)`,
  },
  [BlurBtnBgToken]: {
    light: colorAlpha(BgSecondary, 0.85),
    dark: colorAlpha(BgSecondary, 0.85),
  },
  [BlurBtnShadowToken]: {
    light: `0 4px 20px ${Gray[300].alpha(0.2)}`,
    dark: `0 4px 20px ${Gray[950].alpha(0.4)}`,
  },
  [BlurBtnHoverShadowToken]: {
    light: `0 8px 24px ${Gray[950].alpha(0.12)}`,
    dark: `0 8px 24px ${Gray[950].alpha(0.3)}`,
  },
  [BlurBtnBorderToken]: {
    light: `1px solid ${Gray[950].alpha(0.08)}`,
    dark: `1px solid ${Gray[100].alpha(0.15)}`,
  },
});
