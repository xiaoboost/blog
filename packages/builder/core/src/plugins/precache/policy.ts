/** 缓存按访问时间淘汰，与构建版本无关。 */
export const policy = {
  /** HTML 按最后访问时间过期；近期仍访问的旧文章可以跨多次发布保留。 */
  pageIdleMs: 90 * 24 * 60 * 60 * 1000,
  /** 超出页数上限时，淘汰最久未访问的 HTML。 */
  pageLimit: 100,
  /** 图片等按需资源独立过期，不通过 HTML 的引用决定保留时间。 */
  runtimeIdleMs: 30 * 24 * 60 * 60 * 1000,
  runtimeLimit: 200,
  /** 运行时缓存的总容量上限，单位为字节。 */
  runtimeBytes: 50 * 1024 * 1024,
  /** 日常访问触发的全量过期检查间隔；没有访问时不定时唤醒 SW。 */
  sweepIntervalMs: 24 * 60 * 60 * 1000,
};

export const cacheNames = {
  /** 完整 HTML；引用列表、内容摘要和访问时间随响应一起保存。 */
  html: 'blog-html',
  /** HTML 直接声明的文件，保留到缓存页面和打开的文档都不再引用。 */
  static: 'blog-static',
  /** 实际请求的正文图片，以及未在 HTML 中声明的字体、SVG 等。 */
  runtime: 'blog-runtime',
  /** 打开文档的引用及清理时间，保证 SW 停止后重新启动仍能继续管理。 */
  meta: 'blog-cache-meta',
};

export const metadata = {
  /** 直接资源 URL 列表，以 URI 编码后的 JSON 写入响应头。 */
  resources: 'x-blog-resources',
  /** HTML 内容摘要，用于判断页面是否需要刷新，与构建版本无关。 */
  revision: 'x-blog-revision',
  used: 'x-blog-last-used',
  /** 运行时响应体的字节数，用于执行总容量限制。 */
  bytes: 'x-blog-bytes',
};

export const messages = {
  ready: 'blog-page-ready',
  updated: 'blog-content-updated',
};
