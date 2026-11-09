import type { IPage, ISite } from '@blog/types';

/** XML 1.0 不允许控制字符；文本和属性中的保留字符统一转义。 */
function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    })[char]!);
}

export function createRss(site: ISite, pages: IPage[], rssUrl: string): string {
  const posts = pages
    .filter((page) => page.type === 'post')
    .map((page) => page.data.post.data)
    .filter((post) => post.public && !post.draft)
    .sort((a, b) => b.create - a.create || a.pathname.localeCompare(b.pathname))
    .slice(0, 20);
  const latestUpdate = posts.length > 0
    ? Math.max(...posts.map((post) => Math.max(post.create, post.update)))
    : undefined;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(new URL(site.publicPath, site.origin).href)}</link>`,
    `    <description>${escapeXml(site.description ?? site.title)}</description>`,
    '    <language>zh-CN</language>',
    `    <atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml" />`,
    ...(latestUpdate === undefined
      ? []
      : [`    <lastBuildDate>${new Date(latestUpdate).toUTCString()}</lastBuildDate>`]),
    ...posts.flatMap((post) => {
      const url = escapeXml(new URL(post.pathname, site.origin).href);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${new Date(post.create).toUTCString()}</pubDate>`,
        '    </item>',
      ];
    }),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function createSitemap(site: ISite, pages: IPage[]): string {
  const publishedPages = pages.filter((page) => (
    page.type !== 'not-found' && (page.type !== 'post' || !page.data.post.data.draft)
  ));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publishedPages.flatMap((page) => {
      const lastmod = page.type === 'post' ? page.data.post.data.update : undefined;
      return [
        '  <url>',
        `    <loc>${escapeXml(new URL(page.pathname, site.origin).href)}</loc>`,
        ...(lastmod === undefined
          ? []
          : [`    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`]),
        '  </url>',
      ];
    }),
    '</urlset>',
    '',
  ].join('\n');
}

export function createRobots(sitemapUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}
