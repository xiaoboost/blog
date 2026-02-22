/** 网站标题字体 */
export const SiteTitleFontFamily = `site-title`;
/** 页面标题字体 */
export const ListTitleFontFamily = `list-title`;
/** 文章标题字体 */
export const ListItemTitleFontFamily = `list-item`;
/** 获取字体路径 */
export const getFontPath = (name: string, subName?: string) => {
  return subName ? `../assets/font/${name}/${name}-${subName}` : `../assets/font/${name}/${name}`;
};
