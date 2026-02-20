/** 标题字体 */
export const TitleFontFamily = `title-font`;
/** 获取字体路径 */
export const getFontPath = (name: string, subName?: string) => {
  return subName ? `../assets/font/${name}/${name}-${subName}` : `../assets/font/${name}/${name}`;
};
