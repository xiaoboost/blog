import { Gray, createThemeStylesByVars } from '@blog/styles/compile';
import {
  CodeTextToken,
  CodeBgToken,
  CodeGutterColorToken,
  CodeSplitToken,
  CodeHighlightBgToken,
  CodeHighlightGutterToken,
  CodeHighlightMarkerToken,
  CodeSyntaxCommentToken,
  CodeSyntaxKeywordToken,
  CodeSyntaxFunctionToken,
  CodeSyntaxStringToken,
  CodeSyntaxNumberToken,
  CodeSyntaxTypeToken,
  CodeSyntaxPropertyToken,
  CodeSyntaxOperatorToken,
} from './token';

// 正文与语法颜色来自 highlight.js 11.11.1 的 atom-one-light.css / atom-one-dark.css。
export default createThemeStylesByVars({
  [CodeTextToken]: {
    light: '#383a42',
    dark: '#abb2bf',
  },
  [CodeBgToken]: {
    light: Gray[50].toString(),
    dark: Gray[800].mix(Gray[950], 0.15).toString(),
  },
  [CodeGutterColorToken]: {
    light: '#8b919a',
    dark: '#777f8e',
  },
  [CodeSplitToken]: {
    light: '#e0e3e8',
    dark: '#353a43',
  },
  [CodeHighlightBgToken]: {
    light: '#eaf0f6',
    dark: '#2b3542',
  },
  [CodeHighlightGutterToken]: {
    light: '#526d89',
    dark: '#a0b8d2',
  },
  [CodeHighlightMarkerToken]: {
    light: '#829ab5',
    dark: '#7894b4',
  },
  [CodeSyntaxCommentToken]: {
    light: '#a0a1a7',
    dark: '#5c6370',
  },
  [CodeSyntaxKeywordToken]: {
    light: '#a626a4',
    dark: '#c678dd',
  },
  [CodeSyntaxFunctionToken]: {
    light: '#4078f2',
    dark: '#61aeee',
  },
  [CodeSyntaxStringToken]: {
    light: '#50a14f',
    dark: '#98c379',
  },
  [CodeSyntaxNumberToken]: {
    light: '#986801',
    dark: '#d19a66',
  },
  [CodeSyntaxTypeToken]: {
    light: '#c18401',
    dark: '#e6c07b',
  },
  [CodeSyntaxPropertyToken]: {
    light: '#e45649',
    dark: '#e06c75',
  },
  [CodeSyntaxOperatorToken]: {
    light: '#0184bb',
    dark: '#56b6c2',
  },
});
