import {
  Gray,
  Red,
  createToken,
  createThemeStylesByVars,
} from '@blog/styles';

// ─── Code-block-typescript 私有 token ─────────────────────

export const [LspInfoBgToken, LspInfoBg] = createToken('lsp-info-bg');
export const [LspInfoTextToken, LspInfoText] = createToken('lsp-info-text');
export const [LspInfoBorderToken, LspInfoBorder] = createToken('lsp-info-border');
export const [LspInfoShadowToken, LspInfoShadow] = createToken('lsp-info-shadow');
export const [LspInfoTypeBorderToken, LspInfoTypeBorder] = createToken('lsp-info-type-border');
export const [LspErrorBgToken, LspErrorBg] = createToken('lsp-error-bg');
export const [LspErrorBorderToken, LspErrorBorder] = createToken('lsp-error-border');
export const [LspErrorBgHoverToken, LspErrorBgHover] = createToken('lsp-error-bg-hover');

// ─── 主题定义 ─────────────────────────────────────────────

export default createThemeStylesByVars({
  [LspInfoBgToken]: {
    light: Gray[100].toString(),
    dark: Gray[800].toString(),
  },
  [LspInfoTextToken]: {
    light: Gray[700].toString(),
    dark: Gray[200].toString(),
  },
  [LspInfoBorderToken]: {
    light: Gray[200].toString(),
    dark: Gray[700].toString(),
  },
  [LspInfoShadowToken]: {
    light: `0 0 6px ${Gray[950].alpha(0.2)}`,
    dark: `0 0 6px ${Gray[950].alpha(0.5)}`,
  },
  [LspInfoTypeBorderToken]: {
    light: Gray[400].mix(Gray[500], 0.6).toString(),
    dark: Gray[500].toString(),
  },
  [LspErrorBgToken]: {
    light: Red[100].toString(),
    dark: Red[500].mix(Gray[900], 0.85).toString(),
  },
  [LspErrorBorderToken]: {
    light: Red[400].toString(),
    dark: Red[300].toString(),
  },
  [LspErrorBgHoverToken]: {
    light: Red[200].toString(),
    dark: Red[500].mix(Gray[900], 0.8).toString(),
  },
});
