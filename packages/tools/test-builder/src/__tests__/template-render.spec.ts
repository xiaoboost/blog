import { Builder } from '@blog/core';
import { builderCache as jssCache, cssCodeCache } from '@blog/core/src/plugins/jss-loader/store';
import { builderCache as scriptCache } from '@blog/core/src/plugins/script-loader/utils';
import { HMRClientScriptPath } from '@blog/shared';
import { describe, expect, it } from '@blog/test-toolkit';
import type { AssetData } from '@blog/types';
import { before } from 'mocha';

function clearBuildCaches() {
  jssCache.clear();
  scriptCache.clear();
  cssCodeCache.clear();
}

describe('模板内部装配资源', () => {
  let assets: AssetData[] = [];
  const posts = new Map<string, {
    template: string;
    pathname: string;
    description: string;
    publishedTime: string;
    styles: string[];
    scripts: string[];
  }>();

  before(async function () {
    this.timeout(120_000);
    // 子构建缓存不区分 mode 和 publicPath，隔离同一进程中的生产构建测试。
    clearBuildCaches();
    // 开发文章包含 Slide，验证两种文章模板以及 HMR 的上下文传递。
    const builder = new Builder({
      mode: 'development',
      publicPath: '/preview/',
      hmr: true,
      write: false,
      typeCheck: false,
      logLevel: 'Silence',
      plugins: [
        {
          name: 'test-template-render',
          apply(builder) {
            builder.hooks.runner.tap('test-template-render', (runner) => {
              runner.registerHook(({ hooks }) => {
                hooks.beforePageRender.tap('test-template-render', ({ page }) => {
                  if (page.type !== 'post') {
                    return;
                  }

                  const { post } = page.data;
                  posts.set(page.outputPath, {
                    template: post.data.template,
                    pathname: page.pathname,
                    description: post.data.description,
                    publishedTime: new Date(post.data.create).toISOString(),
                    styles: post.utils.getStyles().map(({ href }) => href),
                    scripts: post.utils.getScripts().map(({ src }) => src),
                  });
                });
              });
            });
          },
        },
      ],
    });

    try {
      await builder.init();
      await builder.build();
      expect(builder.getErrors().map(({ message }) => message)).deep.eq([]);
      assets = builder.getAssets();
    }
    finally {
      await builder.stop();
      clearBuildCaches();
    }
  });

  it('所有页面从渲染上下文启用 HMR，保留公共资源前缀和站点导航', () => {
    const pages = assets.filter(({ path }) => path.endsWith('.html'));
    expect(pages).not.empty;
    for (const { path, content } of pages) {
      const html = content.toString();
      const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src);
      expect(scripts.filter((src) => src === HMRClientScriptPath), path).length(1);
      expect(scripts.filter((src) => src === '/preview/scripts/layout.js'), path).length(1);
      expect(scripts.filter((src) => src === '/preview/scripts/theme.js'), path).length(1);
      expect(html, path).include('href="/preview/styles/layout.css"');
      // 构建器 publicPath 是资源前缀，页面导航仍使用 Site 中的站点路径。
      expect(html, path).include('href="/"');
      expect(html, path).include('href="/archive/"');
    }
  });

  it('普通文章和 Slide 在内部消费编译后的资源，保留文章元数据且不重复引用', () => {
    expect(new Set([...posts.values()].map(({ template }) => template))).deep.eq(new Set(['post', 'slide']));
    for (const [path, post] of posts) {
      const html = assets.find((asset) => asset.path === path)!.content.toString();
      const styles = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)]
        .map(([, href]) => href);
      const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src);
      expect(post.styles, path).not.empty;
      expect(post.scripts, path).not.empty;
      post.styles.forEach((href) => expect(styles.filter((item) => item === href), path).length(1));
      post.scripts.forEach((src) => expect(scripts.filter((item) => item === src), path).length(1));
      expect(new Set(styles).size, path).eq(styles.length);
      expect(new Set(scripts).size, path).eq(scripts.length);
      expect(styles, path).not.include('/preview/styles/not-found.css');
      expect(html, path).include(`property="article:published_time" content="${post.publishedTime}"`);
      expect(html, path).include('property="og:type" content="article"');
      const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)![1];
      expect(new URL(canonical).pathname, path).eq(post.pathname);

      if (post.template === 'slide') {
        expect(html, path).include('data-slide-section');
        expect(styles, path).include('/preview/styles/slide.css');
        expect(scripts, path).include('/preview/scripts/slide.js');
        expect(html, path).include(`name="description" content="${post.description}"`);
      }
    }
  });

  it('404 的独立样式保留资源前缀，且没有混入公共包', () => {
    const html = assets.find(({ path }) => path === '/404.html')!.content.toString();
    expect(html).include('href="/preview/styles/not-found.css"');
    expect(html).include('name="robots" content="noindex"');
    expect(html).not.include('aria-label="主导航"');
    const layout = assets.find(({ path }) => path === '/preview/styles/layout.css')!.content.toString();
    const notFound = assets.find(({ path }) => path === '/preview/styles/not-found.css')!.content.toString();
    expect(layout).not.include('not-found-tail-peek');
    expect(notFound).include('not-found-tail-peek');
  });
});
