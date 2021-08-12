// 主要颜色定义
export const Shadow = '#CCC';

export const Blue = '#1890FF';
export const BlueLight = '#69c0ff';

export const Green = '#bae637';
export const GreenLight = '#eaff8f';

export const Gray = '#DDD';
export const GrayLight = '#f0f2f7';

export const White = '#fff';
export const WhiteBg = '#F6F6F6';

export const Red = '#D41324';
export const RedLight = '#FF6969';

export const Yellow = '#fdcb6e';
export const YellowLight = '#ffeaa7';
export const YellowLighter = '#fef9ed';

export const Black = '#303133';
export const BlackLight = '#606266';
export const BlackLighter = '#909399';
export const BlackExtraLight = '#C0C4CC';

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
export const mainWidth = '1000px';
/** 右侧边栏宽度 */
export const articleWidth = '750px';
/** 右侧边栏挂件间隔 */
export const asideMarginLeft = '20px';
/** 默认字体大小 */
export const FontDefaultSize = '14px';

export const mediaPhone = `@media only screen and (max-width: ${mainWidth})`;

export const mediaPc = `@media only screen and (min-width: ${mainWidth})`;
