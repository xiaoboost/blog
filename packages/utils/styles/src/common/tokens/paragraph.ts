import { createToken } from '../theme';

/**
 * 段落首行缩进量
 *
 * @description 这个变量会改变当前 DOM 下所有元素的缩进
 */
export const [ParagraphIndentToken, ParagraphIndent] = /* @__PURE__ */ createToken('paragraph-indent');
