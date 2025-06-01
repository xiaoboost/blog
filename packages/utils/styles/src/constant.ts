// cSpell:disable

/** 自定义字体名称枚举 */
export const CustomFont = {
  /** 英文正文 */
  Lato: `"Lato"`,
  /** 网站大标题 */
  Dancing: `"Dancing Script"`,
  /** 斜体英文 */
  EMLora: `"EM-Lora"`,
};

/** 默认字体 */
export const FontDefault = /* @__PURE__ */ [
  CustomFont.Lato,
  /** 思源黑体 */
  '"Source Han Sans SC"',
  '思源黑体',
  /** MacOS 默认字体 */
  '-apple-system',
  /** MacOS 苹方 */
  '"PingFang SC"',
  /** MacOS 冬青黑 */
  '"Hiragino Sans GB"',
  /** Windows 微软雅黑 */
  '"Microsoft YaHei"',
  /** Linux 文泉驿黑体 */
  '"WenQuanYi Micro Hei"',
  /** 安卓默认字体 */
  '"Noto Sans CJK SC"',
  'sans-serif',
].join(', ');

/** 衬线字体 */
export const FontSerif = /* @__PURE__ */ [
  /** 思源宋体 */
  '"Source Han Serif"',
  '"思源宋体"',
  /** MocOS 宋体 */
  '"Songti SC"',
  /** MacOS 华文宋体 */
  'STSong',
  /** windows 中易中宋 */
  'STZhongsong',
  /** windows 宋体 */
  'SimSun',
  /* Android 衬线字体 */
  '"Noto Serif CJK SC"',
  /* 跨平台英文字体 */
  'Georgia',
  '"Times New Roman"',
  'serif',
].join(', ');

/** 等宽字体 */
export const FontMono = /* @__PURE__ */ [
  'Menlo',
  'Monaco',
  'Consolas',
  '"Courier New"',
  'monospace',
].join(', ');

/** 标题字体 */
export const FontTitle = CustomFont.Dancing;

/** 网站宽度 */
export const mainWidth = 900;
/** 文章主体和顶栏的空隙高度 */
export const headerBodyMargin = 20;
/** 默认字体大小 */
export const FontDefaultSize = 14;
/** 移动端判断 */
export const mediaPhone = `@media only screen and (max-width: ${mainWidth}px)`;
/** PC 端判断 */
export const mediaPc = `@media only screen and (min-width: ${mainWidth}px)`;
/** 标题元素选择器 */
export const getHeadSelector = (pre = '') => {
  return Array(5)
    .fill(0)
    .map((_, i) => `${pre}h${i + 1}`)
    .join(',');
};
