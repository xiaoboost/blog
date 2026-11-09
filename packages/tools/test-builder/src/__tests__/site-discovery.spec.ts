import { describe, expect, it } from '@blog/test-toolkit';
import type { PostBasicData } from '@blog/types';
import { defineUtils } from '../../../../builder/context/src/runtime/hook/assets';
import { createRobots, createRss, createSitemap } from '../../../../builder/core/src/plugins/site-discovery/assets';
import { Page } from '../../../../builder/generator/src/model/page';
import { Site } from '../../../../builder/generator/src/model/site';

const site = new Site({
  title: '博客 & 订阅',
  origin: 'https://example.com',
  description: '文章 < 简介',
  publicPath: '/blog/',
  aboutPath: '/blog/about/',
  tagPath: 'tags',
  archivePath: 'archive',
});

function post(index: number, overrides: Partial<PostBasicData> = {}) {
  return new Page({
    type: 'post',
    pathname: overrides.pathname ?? `/blog/posts/${index}/`,
    title: overrides.title ?? `文章 ${index}`,
    data: {
      post: {
        data: {
          title: `文章 ${index}`,
          pathname: `/blog/posts/${index}/`,
          create: Date.UTC(2026, 0, index + 1),
          update: Date.UTC(2026, 0, index + 2),
          public: true,
          draft: false,
          description: '简介 & <引号 "\'>',
          tags: [],
          coverImage: null,
          filePath: `posts/${index}/index.md`,
          ast: { type: 'root', children: [] },
          toc: true,
          showPageNumberInSlide: true,
          lsp: false,
          template: 'post',
          ...overrides,
        },
        utils: defineUtils(),
        Component: () => null,
      },
    },
    render: () => '',
  });
}

describe('SiteDiscovery', () => {
  it('RSS 只保留最新 20 篇公开文章，更新时间不改变 GUID 和发布时间', () => {
    const pages = Array.from({ length: 25 }, (_, index) => post(index));
    pages.push(post(26, { draft: true }), post(27, { public: false }));
    const url = 'https://example.com/blog/rss.xml';
    const rss = createRss(site, pages, url);
    const guids = [...rss.matchAll(/<guid isPermaLink="true">([^<]+)<\/guid>/g)]
      .map(([, guid]) => guid);
    expect(guids).deep.eq(Array.from({ length: 20 }, (_, index) => (
      `https://example.com/blog/posts/${24 - index}/`
    )));
    pages[24].data.post.data.update = Date.UTC(2026, 5, 1);
    const updated = createRss(site, pages, url);
    expect(updated.match(/<guid[^>]*>[^<]+<\/guid>/g))
      .deep.eq(rss.match(/<guid[^>]*>[^<]+<\/guid>/g));
    expect(updated.match(/<pubDate>[^<]+<\/pubDate>/g))
      .deep.eq(rss.match(/<pubDate>[^<]+<\/pubDate>/g));
    expect(updated).include('<lastBuildDate>Mon, 01 Jun 2026 00:00:00 GMT</lastBuildDate>');
  });

  it('XML 转义标题、简介与属性，中文 URL 正确编码，空订阅也能生成', () => {
    const rss = createRss(site, [
      post(0, {
        title: '标题 & <测试>\u0001',
        pathname: '/blog/中文/?a=1&b=2',
      }),
    ], 'https://example.com/blog/rss.xml?a=1&b=2');
    expect(rss).include('<title>标题 &amp; &lt;测试&gt;</title>');
    expect(rss).include('简介 &amp; &lt;引号 &quot;&apos;&gt;');
    expect(rss).include('/blog/%E4%B8%AD%E6%96%87/?a=1&amp;b=2');
    expect(rss).include('href="https://example.com/blog/rss.xml?a=1&amp;b=2"');
    const empty = createRss(site, [], 'https://example.com/blog/rss.xml');
    expect(empty).include('<channel>');
    expect(empty).not.include('<item>');
    expect(empty).not.include('<lastBuildDate>');
    expect(empty).not.include('Invalid Date');
  });

  it('sitemap 保留独立页面和分页，排除草稿与 404，仅文章标记修改日期', () => {
    const about = post(0, { public: false, pathname: '/blog/about/' });
    const pagination = new Page({
      type: 'index',
      pathname: '/blog/index/1/',
      title: '第 2 页',
      data: { posts: [], index: 1, count: 2 },
      render: () => '',
    });
    const notFound = new Page({
      type: 'not-found',
      pathname: '/404.html',
      title: '404',
      data: {},
      render: () => '',
    });
    const pages = [
      about,
      pagination,
      post(1, { draft: true }),
      notFound,
    ];
    const sitemap = createSitemap(site, pages);
    expect(sitemap).include('<loc>https://example.com/blog/about/</loc>');
    expect(sitemap).include('<loc>https://example.com/blog/index/1/</loc>');
    expect(sitemap).include('<lastmod>2026-01-02T00:00:00.000Z</lastmod>');
    expect(sitemap.match(/<lastmod>/g)).length(1);
    expect(sitemap).not.include('/posts/1/');
    expect(sitemap).not.include('/404.html');
    expect(createSitemap(site, pages)).eq(sitemap);
  });

  it('Site 和 Page 的 link 支持覆盖，输入与返回值不会修改内部声明', () => {
    const link = { rel: 'alternate', href: 'https://example.com/rss.xml', title: '初始' };
    const page = post(0);
    for (const target of [site, page]) {
      target.addLink(link);
      target.addLink({ ...link, title: '覆盖' });
      const snapshot = target.getLinks();
      snapshot[0].title = '外部修改';
      expect(target.getLinks()).deep.eq([{ ...link, title: '覆盖' }]);
    }
    link.title = '修改输入';
    expect(page.getLinks()[0].title).eq('覆盖');
  });

  it('robots 允许抓取并使用完整的 sitemap 地址', () => {
    expect(createRobots('https://example.com/blog/sitemap.xml')).eq(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.com/blog/sitemap.xml\n',
    );
  });
});
