import { normalizeUrl } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';
import { createRobots, createRss, createSitemap } from './assets';

const pluginName = 'site-discovery';

/** 发布站点的订阅源、站点地图和爬虫规则。 */
export const SiteDiscovery = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    if (builder.options.mode !== 'production') {
      return;
    }

    builder.hooks.runner.tap(pluginName, (runner) => {
      runner.registerHook(({ hooks }) => {
        hooks.beforeBuild.tap(pluginName, ({ site, pages }) => {
          const rssPath = normalizeUrl(site.publicPath, 'rss.xml');
          const sitemapPath = normalizeUrl(site.publicPath, 'sitemap.xml');
          const rssUrl = new URL(rssPath, site.origin).href;
          const sitemapUrl = new URL(sitemapPath, site.origin).href;

          site.addAsset({ path: rssPath, content: Buffer.from(createRss(site, pages, rssUrl)) });
          site.addAsset({ path: sitemapPath, content: Buffer.from(createSitemap(site, pages)) });
          site.addAsset({ path: '/robots.txt', content: Buffer.from(createRobots(sitemapUrl)) });
          site.addLink({
            rel: 'alternate',
            type: 'application/rss+xml',
            title: site.title,
            href: rssUrl,
          });
        });
      });
    });
  },
});
