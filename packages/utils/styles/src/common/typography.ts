/** 标题字体的公共约定；具体字体资源由模板负责注册。 */

/** 主标题的字体约定，用于字体注册、文字收集和样式引用。 */
export const PrimaryTitleFont = {
  fontFamily: 'primary-title',
  fontWeight: 700,
} as const;

/** 次级标题的字体约定，用于字体注册、文字收集和样式引用。 */
export const SecondaryTitleFont = {
  fontFamily: 'secondary-title',
  fontWeight: 600,
} as const;
