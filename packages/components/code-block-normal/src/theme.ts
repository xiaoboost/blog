import {
  Gray,
  createToken,
  createThemeStylesByVars,
} from '@blog/styles';

// ─── Code-block-normal 私有 token ─────────────────────────

export const [CodeTextToken, CodeText] = createToken('code-text');
export const [CodeBgToken, CodeBg] = createToken('code-bg');
export const [CodeGutterBgToken, CodeGutterBg] = createToken('code-gutter-bg');
export const [CodeGutterColorToken, CodeGutterColor] = createToken('code-gutter-color');
export const [CodeSplitToken, CodeSplit] = createToken('code-split');
export const [CodeHighlightBgToken, CodeHighlightBg] = createToken('code-highlight-bg');
export const [CodeHighlightGutterToken, CodeHighlightGutter] = createToken('code-highlight-gutter');

// ─── 主题定义 ─────────────────────────────────────────────

export default createThemeStylesByVars({
  [CodeTextToken]: {
    light: Gray[500].toString(),
    dark: Gray[300].toString(),
  },
  [CodeBgToken]: {
    light: Gray[50].toString(),
    dark: Gray[800].toString(),
  },
  [CodeGutterBgToken]: {
    light: Gray[50].mix(Gray[300], 0.25).toString(),
    dark: Gray[800].mix(Gray[950], 0.3).toString(),
  },
  [CodeGutterColorToken]: {
    light: Gray[400].toString(),
    dark: Gray[500].toString(),
  },
  [CodeSplitToken]: {
    light: Gray[200].toString(),
    dark: Gray[700].toString(),
  },
  [CodeHighlightBgToken]: {
    light: Gray[100].toString(),
    dark: Gray[700].toString(),
  },
  [CodeHighlightGutterToken]: {
    light: Gray[500].toString(),
    dark: Gray[200].toString(),
  },
});
