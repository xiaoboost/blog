import Color from 'color';

export { Color };

// 主要颜色定义
export const Shadow = Color(0xCCCCCC);
export const Blue = Color(0x1890FF);
export const BlueLight = Color(0x69C0FF);
export const Green = Color(0xbae637);
export const GreenLight = Color(0xEAFF8F);
export const Gray = Color(0xDDDDDD);
export const GrayLight = Color(0xf0f2f7);
export const White = Color(0xFFFFFF);
export const WhiteBg = Color(White.rgbNumber() - 0x090909);
export const Red = Color(0xD41324);
export const RedLight = Color(0xFF6969);
export const Yellow = Color(0xFDCB6E);
export const YellowLight = Color(0xFFEAA7);
export const YellowLighter = Color(0xFEF9ED);
export const Black = Color(0x303133);
export const BlackLight = Color(0x606266);
export const BlackLighter = Color(0x909399);
export const BlackExtraLight = Color(0xC0C4CC);

function getFontFamily(names: string[]) {
  return names.join(', ');
}

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
export const FontDefault = getFontFamily([
  CustomFont.Lato,
  '-apple-system',
  'BlinkMacSystemFont',
  'PingFang SC',
  '思源黑体',
  'Source Han Sans SC',
  'Noto Sans CJK SC',
  'WenQuanYi Micro Hei',
  'Microsoft YaHei',
  'sans-serif'
]);

/** 衬线字体 */
export const FontSerif = getFontFamily([
  '思源宋体',
  'STSong',
  '宋体',
  'serif',
]);

/** 等宽字体 */
export const FontMono = getFontFamily([
  'Menlo',
  'Monaco',
  'Consolas',
  'Courier New',
  'monospace',
]);

/** 标题字体 */
export const FontTitle = getFontFamily([
  CustomFont.Dancing,
]);

/** 网站宽度 */
export const mainWidth = 1000;
/** 右侧边栏宽度 */
export const articleWidth = 750;
/** 右侧边栏挂件间隔 */
export const asideMarginLeft = 20;
/** 文章主体和顶栏的空隙高度 */
export const headerBodyMargin = 20;
/** 默认字体大小 */
export const FontDefaultSize = 14;

export const mediaPhone = `@media only screen and (max-width: ${mainWidth}px)`;

export const mediaPc = `@media only screen and (min-width: ${mainWidth}px)`;
