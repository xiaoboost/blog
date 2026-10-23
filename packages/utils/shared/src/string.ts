export const HTTP_PATTERNS = /^(https?:)?\/\//;
export const DATAURL_PATTERNS = /^data:/;
export const isUrl = (source: string) =>
  HTTP_PATTERNS.test(source) || DATAURL_PATTERNS.test(source);

/** 将站点 origin 与站内路径拼成绝对 URL，不依赖运行环境的 URL 全局对象。 */
export function toAbsoluteUrl(origin: string, pathname: string) {
  return `${origin.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`;
}
