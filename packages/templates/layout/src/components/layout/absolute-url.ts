/** 将站点 origin 与站内路径拼成绝对 URL，不依赖渲染沙箱的 URL 全局对象。 */
export function toAbsoluteUrl(origin: string, pathname: string) {
  return `${origin.replace(/\/+$/, '')}/${pathname.replace(/^\/+/, '')}`;
}
