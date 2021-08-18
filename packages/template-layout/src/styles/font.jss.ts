import { createFontFaceStyles, mergeStyles, CustomFont } from '@blog/styles';

function getFontPath(name: string, subName?: string) {
  return subName
    ? `../assets/font/${name}/${name}-${subName}`
    : `../assets/font/${name}/${name}`;
}

export default mergeStyles(
  // 标题字体
  createFontFaceStyles(
    CustomFont.Dancing,
    'normal',
    'normal',
    getFontPath('dancing'),
  ),
  // 英文正文
  createFontFaceStyles(
    CustomFont.Lato,
    'normal',
    'bold',
    getFontPath('Lato', 'Bold'),
  ),
  createFontFaceStyles(
    CustomFont.Lato,
    'italic',
    'normal',
    getFontPath('Lato', 'Italic'),
  ),
  createFontFaceStyles(
    CustomFont.Lato,
    'normal',
    'normal',
    getFontPath('Lato', 'Regular'),
  ),
  createFontFaceStyles(
    CustomFont.Lato,
    'italic',
    'bold',
    getFontPath('Lato', 'BoldItalic'),
  ),
  // 英文斜体样式重载
  createFontFaceStyles(
    CustomFont.EMLora,
    'normal',
    'normal',
    getFontPath('Lora', 'Italic'),
  ),
);
