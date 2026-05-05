import { Gray, createThemeStylesByVars } from '@blog/styles/compile';
import {
  CodeTextToken,
  CodeBgToken,
  CodeGutterBgToken,
  CodeGutterColorToken,
  CodeSplitToken,
  CodeHighlightBgToken,
  CodeHighlightGutterToken,
} from './token';

export default createThemeStylesByVars({
  [CodeTextToken]: {
    light: Gray[500].toString(),
    dark: Gray[300].toString(),
  },
  [CodeBgToken]: {
    light: Gray[50].toString(),
    dark: Gray[800].mix(Gray[950], 0.15).toString(),
  },
  [CodeGutterBgToken]: {
    light: Gray[50].mix(Gray[300], 0.25).toString(),
    dark: Gray[900].toString(),
  },
  [CodeGutterColorToken]: {
    light: Gray[400].toString(),
    dark: Gray[500].toString(),
  },
  [CodeSplitToken]: {
    light: Gray[200].toString(),
    dark: Gray[600].toString(),
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
