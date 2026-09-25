/** 网站标题字体 */
export const SiteTitleFontFamily = 'site-title';
/** 页面标题字体 */
export const ListTitleFontFamily = 'list-title';
/** 对应 SourceHanSerifSC-Bold.otf */
export const ListTitleFontWeight = 700;
/** 文章标题字体 */
export const ListItemTitleFontFamily = 'list-item';
/** 对应 SourceHanSerifSC-SemiBold.otf */
export const ListItemTitleFontWeight = 600;
/** 获取字体路径 */
export const getFontPath = (name: string, subName?: string) => {
  return subName ? `../assets/fonts/${name}/${name}-${subName}` : `../assets/fonts/${name}/${name}`;
};
