import { Gray, createThemeStylesByVars } from '@blog/styles/compile';
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
    light: `linear-gradient(to right, ${Gray[0]} 25%, transparent 100%)`,
    dark: `linear-gradient(to right, ${Gray[900]} 25%, transparent 100%)`,
  },
  [FogGradientRightToken]: {
    light: `linear-gradient(to left, ${Gray[0]} 25%, transparent 100%)`,
    dark: `linear-gradient(to left, ${Gray[900]} 25%, transparent 100%)`,
  },
  [OverlayGradientToken]: {
    light: `linear-gradient(to bottom, transparent 30%, ${Gray[0].alpha(0.8)} 70%, ${Gray[0]} 100%)`,
    dark: `linear-gradient(to bottom, transparent 30%, ${Gray[900].alpha(0.8)} 70%, ${Gray[900]} 100%)`,
  },
  [BlurBtnBgToken]: {
    light: Gray[0].alpha(0.85).toString(),
    dark: Gray[900].alpha(0.85).toString(),
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
