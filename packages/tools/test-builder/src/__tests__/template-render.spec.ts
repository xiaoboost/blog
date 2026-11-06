import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { Builder } from '@blog/core';
import { builderCache as jssCache, cssCodeCache } from '@blog/core/src/plugins/jss-loader/store';
import { getPostsInputCode } from '@blog/core/src/plugins/post-loader/utils';
import { builderCache as scriptCache } from '@blog/core/src/plugins/script-loader/utils';
import { HMRClientScriptPath } from '@blog/shared';
import { describe, expect, it } from '@blog/test-toolkit';
import type { AssetData } from '@blog/types';
import { before } from 'mocha';
import { SlideExportScript } from '../../../../templates/slide/src/export/constant';

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
    // 开发与生产使用不同资源配置，隔离进程内的子构建缓存。
    clearBuildCaches();
    // 只编译两个最小 MDX 样例，保留真实解析、模板资源和 HMR 管线。
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
            builder.hooks.bundler.tap('test-template-render', (bundler) => {
              bundler.hooks.transform.tap('test-browser-config', (input, ctx) => {
                const path = input.module.sourcePath?.replaceAll('\\', '/');
                const name = path?.endsWith('/components/slide/src/index.tsx')
                  ? 'component.editor'
                  : undefined;

                if (!name) {
                  return input;
                }

                return ctx.update(input, {
                  code: input.code.replace('defineUtils(assets)',
                    `defineUtils(assets, { browserConfig: { lazyScripts: { "${name}": ["/preview/scripts/${name}.js"] } } })`),
                  map: null,
                });
              });
              bundler.hooks.load.tap({ name: 'test-template-render', stage: -100 }, (args) => {
                if (args.namespace !== 'posts-loader') {
                  return;
                }

                return {
                  contents: getPostsInputCode(['post', 'slide'].map((name) =>
                    resolve(args.pluginData, 'fixtures/templates', `${name}.mdx`).replaceAll('\\', '/'))),
                  resolveDir: args.pluginData,
                };
              });
            });
            builder.hooks.runner.tap('test-template-render', (runner) => {
              runner.registerHook(({ hooks }) => {
                hooks.afterReady.tap('test-browser-config-before-render', ({ pages }) => {
                  const page = pages.find((page) => page.type === 'post'
                    && page.data.post.data.template === 'slide')!;
                  // 尚未预渲染，模板和组件的配置应已由生成器登记。
                  expect(page.getBrowserConfig().lazyScripts).deep.eq({
                    [SlideExportScript]: ['/preview/scripts/export-pdf.js'],
                    'component.editor': ['/preview/scripts/component.editor.js'],
                  });
                });
                hooks.beforePageRender.tap('test-template-render', ({ page }) => {
                  if (page.type !== 'post') {
                    return;
                  }

                  const { post } = page.data;

                  if (post.data.template === 'slide') {
                    page.addBrowserConfig({ lazyScripts: { 'page.tool': ['/preview/scripts/page-tool.js'] } });
                  }

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
        expect(html.indexOf('aria-label="导出"')).lessThan(html.indexOf('aria-label="播放（全屏）"'));
        expect(html).include('aria-label="导出"');
        expect(html, path).include('data-slide-section');
        expect(styles, path).include('/preview/styles/slide.css');
        expect(scripts, path).include('/preview/scripts/slide.js');
        expect(html, path).include(`name="description" content="${post.description}"`);
      }
    }
  });

  it('模板、组件和页面配置合并成一份 head 脚本，普通页面不生成配置', () => {
    for (const [path, post] of posts) {
      const html = assets.find((asset) => asset.path === path)!.content.toString();
      const configs = assets.filter((asset) => asset.path.startsWith(post.pathname)
        && asset.path.endsWith('/browser-config.js'));

      if (post.template !== 'slide') {
        expect(configs).length(0);
        expect(html).not.include('browser-config.js');
        continue;
      }

      expect(configs).length(1);
      const config = configs[0];
      expect(html.split('</head>')[0]).include(`src="${config.path}" async=""`);
      expect(html.split('</head>')[0]).include('id="__BLOG_BROWSER_CONFIG__"');
      const browser: Record<string, any> = { Event, dispatchEvent: () => true };
      runInNewContext(config.content.toString(), browser);
      expect(browser.__BLOG_BROWSER_CONFIG__).not.have.property('slide');
      expect(browser.__BLOG_BROWSER_CONFIG__.lazyScripts).deep.eq({
        [SlideExportScript]: ['/preview/scripts/export-pdf.js'],
        'component.editor': ['/preview/scripts/component.editor.js'],
        'page.tool': ['/preview/scripts/page-tool.js'],
      });
      const lazyScripts = browser.__BLOG_BROWSER_CONFIG__.lazyScripts as Record<string, string[]>;
      for (const paths of Object.values(lazyScripts)) {
        expect(html).not.include(`src="${paths[0]}"`);
      }
      expect(browser.__BLOG_SLIDE_CONFIG__).eq(undefined);
      expect(assets.some((asset) => asset.path.includes('slide-data'))).eq(false);
    }
  });

  it('公共模板的导出脚本独立产出，播放器包中没有导出代码', () => {
    const marker = '没有可以导出的幻灯片。';
    const lazy = assets.find(({ path }) => path === '/preview/scripts/export-pdf.js')!;
    expect(lazy).not.eq(undefined);
    expect(lazy.content.toString()).include(marker);
    const player = assets.find(({ path }) => path === '/preview/scripts/slide.js')!;
    expect(player.content.toString()).not.include(marker);
    expect(lazy.content.toString()).include('%PDF-');
    expect(player.content.toString()).not.include('%PDF-');
  });

  it('404 的独立样式保留资源前缀', () => {
    const html = assets.find(({ path }) => path === '/404.html')!.content.toString();
    expect(html).include('href="/preview/styles/not-found.css"');
    expect(html).include('name="robots" content="noindex"');
    expect(assets.some(({ path }) => path === '/preview/styles/not-found.css')).true;
  });
});
