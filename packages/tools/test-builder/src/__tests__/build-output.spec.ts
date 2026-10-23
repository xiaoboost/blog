import { Builder } from '@blog/core';
import { expect, describe, it } from '@blog/test-toolkit';
import type {
  AssetData,
  IResourceSet,
  PageType,
  PreloadAssetData,
  ScriptAssetData,
  StyleAssetData,
} from '@blog/types';
import { before } from 'mocha';

/**
 * HTML 链接提取：从 HTML 中提取所有 href 和 src
 * 忽略外部 URL、锚点、mailto、data URI
 */
function extractLinks(html: string): string[] {
  const links: string[] = [];
  const attrRegex = /\b(?:href|src)="([^"]+)"/gi;

  for (const match of html.matchAll(attrRegex)) {
    const url = match[1];

    if (/^(https?:|\/\/|#|mailto:|tel:|data:)/i.test(url)) {
      continue;
    }

    links.push(url);
  }

  return links;
}

/** 提取 <title> 内容 */
function extractTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? match[1].trim() : '';
}

/** 提取指定 property/name 的 meta content */
function extractMetaContent(html: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `<meta[^>]+(?:property|name)="${escapedKey}"[^>]+content="([^"]+)"`,
    'i',
  ).exec(html);
  return match ? match[1] : '';
}

/**
 * 将 HTML 中的链接地址转换为可能的 asset path
 * 链接格式：/posts/slug/ 或 /styles/file.css
 * asset path：/posts/slug/index.html 或 /styles/file.css
 */
function linkToAssetPaths(link: string): string[] {
  const clean = link.split(/[?#]/)[0];
  // 确保以 / 开头
  const normalized = clean.startsWith('/') ? clean : `/${clean}`;

  // 目录型链接 → 补 index.html
  if (normalized.endsWith('/')) {
    return [`${normalized}index.html`];
  }

  // 有扩展名的文件链接 → 直接匹配
  if (normalized.includes('.')) {
    return [normalized];
  }

  // 无扩展名无斜杠 → 既可能是文件也可能是目录
  return [normalized, `${normalized}/index.html`, `${normalized}.html`];
}

describe('博客构建 e2e', () => {
  let assets: AssetData[] = [];
  let assetMap = new Map<string, Buffer>();
  let htmlAssets: AssetData[] = [];
  let errors: string[] = [];
  const postAssetPaths = new Set<string>();
  const listedPostUrls = new Set<string>();
  const resourcePages = new Map<string, { type: PageType; script: ScriptAssetData }>();
  let sharedPreScript: ScriptAssetData;
  let sharedScript: ScriptAssetData;
  let sharedStyle: StyleAssetData;
  let sharedPreload: PreloadAssetData;
  let sharedPreloads: PreloadAssetData[] = [];

  before(async function () {
    this.timeout(120_000);

    const builder = new Builder({
      mode: 'production',
      write: false,
      logLevel: 'Silence',
      typeCheck: false,
      plugins: [
        {
          name: 'test-resource-config',
          apply(builder) {
            builder.hooks.runner.tap('test-resource-config', (runner) => {
              runner.registerHook(({ hooks }) => {
                hooks.beforePageRender.tap('test-resource-config', ({ page, site }) => {
                  const resources = resourcePages.get(page.outputPath);

                  if (resources) {
                    // 正式渲染前新增页面资源，同时验证 Site / Page 重复引用的去重。
                    page.addScript(resources.script);
                    page.addPreScript({ ...sharedPreScript });
                    page.addScript({ ...sharedScript });
                    page.addStyle({ ...sharedStyle });
                    page.addPreload({ ...sharedPreload });
                  }

                  if (page.type === 'not-found') {
                    sharedPreloads = site.getPreloads();
                  }
                });
                hooks.afterReady.tap('test-resource-config', ({ site, pages, rename }) => {
                  const addAsset = (resources: IResourceSet, name: string) => {
                    const content = Buffer.from(name.endsWith('.css')
                      ? ':root{--test-style:1}'
                      : `window.testScriptAsset = ${JSON.stringify(name)};`);
                    const path = rename({ path: name, content });
                    resources.addAsset({ path, content });
                    return path;
                  };
                  sharedPreScript = {
                    src: addAsset(site, 'test-pre.js'),
                    type: 'module',
                    async: true,
                    crossOrigin: 'anonymous',
                  };
                  sharedScript = { src: addAsset(site, 'test-script-shared.js'), defer: true };
                  sharedStyle = { href: addAsset(site, 'test-style.css'), media: 'print', crossOrigin: 'anonymous' };
                  sharedPreload = { ...sharedStyle, as: 'style', type: 'text/css' };
                  site.addPreScript(sharedPreScript);
                  site.addScript(sharedScript);
                  site.addStyle(sharedStyle);
                  site.addPreload(sharedPreload);

                  const selected = new Set<PageType>();
                  for (const page of pages) {
                    if (page.type === 'post') {
                      postAssetPaths.add(page.toAsset().path);

                      if (page.data.post.data.public && !page.data.post.data.draft) {
                        listedPostUrls.add(page.pathname);
                      }
                    }

                    if (!['index', 'post', 'not-found'].includes(page.type) || selected.has(page.type)) {
                      continue;
                    }

                    selected.add(page.type);
                    resourcePages.set(page.toAsset().path, {
                      type: page.type,
                      script: { src: addAsset(page, `test-script-${page.type}.js`), defer: true },
                    });
                  }
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
      errors = builder.getErrors().map((e) => `${e.name}: ${e.message}`);
      assets = builder.getAssets();
      assetMap = new Map(assets.map((a) => [a.path, a.content]));
      htmlAssets = assets.filter((a) => a.path.endsWith('.html'));
    }
    finally {
      await builder.stop();
    }
  });

  it('构建成功无错误', () => {
    expect(errors, errors.join('\n')).to.be.empty;
  });

  // ── ① 链接完整性 ──────────────────────────────────

  it('所有 HTML 内部链接指向存在的文件', () => {
    const brokenLinks: string[] = [];

    for (const { path, content } of htmlAssets) {
      const html = content.toString('utf-8');
      const links = extractLinks(html);

      for (const link of links) {
        const candidates = linkToAssetPaths(link);
        const found = candidates.some((c) => assetMap.has(c));

        if (!found) {
          brokenLinks.push(`${path} → ${link}`);
        }
      }
    }

    expect(brokenLinks).to.be.empty;
  });

  it('404 单独加载页面资源和字体，同时复用 layout 的共享资源', () => {
    const html = assetMap.get('/404.html')?.toString();
    expect(html, '缺少根目录的 404.html').not.undefined;
    expect(assetMap.has('/404.html/index.html')).false;
    expect(assets.some(({ path }) => path.startsWith('/404.html/'))).false;
    expect(extractMetaContent(html!, 'robots')).eq('noindex');
    expect(html).not.include('rel="canonical"');
    expect(html).not.include('property="og:url"');
    const fontPreloadPattern = /<link\b[^>]*rel="preload"[^>]*href="([^"]+)"[^>]*as="font"/g;
    const fontPreloads = [...html!.matchAll(fontPreloadPattern)]
      .map(([, href]) => href);
    const sharedFontPreloads = sharedPreloads.filter(({ as }) => as === 'font').map(({ href }) => href);
    expect(sharedFontPreloads).not.empty;
    const titleFontPath = fontPreloads.find((href) => (
      /\/not-found-title\.[^/]+\.woff2$/.test(href)
    ));
    expect(titleFontPath, '缺少 404 标题字体').not.undefined;
    expect(assetMap.has(titleFontPath!)).true;
    expect(fontPreloads).have.members([...sharedFontPreloads, titleFontPath]);
    const links = extractLinks(html!);
    expect(links.some((href) => /\/layout\.[^/]+\.js$/.test(href))).true;
    const layoutCssPath = links.find((href) => /\/layout\.[^/]+\.css$/.test(href));
    expect(layoutCssPath).not.undefined;
    const cssPath = links.find((href) => /\/not-found\.[^/]+\.css$/.test(href));
    expect(cssPath).not.undefined;
    for (const { path, content } of htmlAssets) {
      if (path !== '/404.html') {
        expect(extractLinks(content.toString()), path).not.include(cssPath);
        expect(extractLinks(content.toString()), path).not.include(titleFontPath);
      }
    }
  });

  it('文章页面均生成', () => {
    const postPages = htmlAssets.filter((a) => postAssetPaths.has(a.path));
    expect(postPages.length, '没有生成任何文章页面').to.be.greaterThan(0);
    expect(postPages.length).eq(postAssetPaths.size);
  });

  it('标签聚合页存在', () => {
    const found = assetMap.has('/tags/index.html');
    expect(found, '标签聚合页 /tags/index.html 不存在').true;
  });

  it('归档聚合页存在', () => {
    const found = assetMap.has('/archive/index.html');
    expect(found, '归档聚合页 /archive/index.html 不存在').true;
  });

  function archivePages() {
    return htmlAssets
      .filter(({ path, content }) => path.startsWith('/archive/') && content.toString().includes('aria-labelledby="archive-year-'))
      .sort((a, b) => (Number(a.path.split('/')[2]) || 0) - (Number(b.path.split('/')[2]) || 0));
  }

  it('归档按 12 篇分页，文章完整且没有重复', () => {
    const pages = archivePages();
    const postLinks = (html: string) => (
      extractLinks(html).filter((href) => listedPostUrls.has(href))
    );
    const actual: string[] = [];
    pages.forEach(({ content }, index) => {
      const links = postLinks(content.toString());
      expect(links.length).to.be.within(1, 12);

      if (index < pages.length - 1) {
        expect(links.length).eq(12);
      }

      actual.push(...links);
    });
    const expected = htmlAssets
      .filter(({ path }) => /^\/(?:index\/\d+\/)?index\.html$/.test(path))
      .sort((a, b) => (Number(a.path.split('/')[2]) || 0) - (Number(b.path.split('/')[2]) || 0))
      .flatMap(({ content }) => postLinks(content.toString()));
    expect(actual).deep.eq(expected);
    expect(new Set(actual).size).eq(actual.length);
  });

  it('同一年跨页时标记接续，归档页各自产出 600 与 400 字重子集', () => {
    const pages = archivePages();
    let previousYear: string | undefined;
    pages.forEach(({ path, content }) => {
      const html = content.toString();
      const years = [...html.matchAll(/aria-labelledby="archive-year-(\d+)"/g)]
        .map((match) => match[1]);
      expect(html.includes('接续上一页的')).eq(years[0] === previousYear);
      previousYear = years.at(-1);
      const fontCssPath = extractLinks(html).find((href) => href.startsWith(path.replace('index.html', '')) && /\/styles\/content-fonts[^/]+\.css$/.test(href));
      expect(fontCssPath, `缺少页面字体：${path}`).not.undefined;
      const css = assetMap.get(fontCssPath!)!.toString();
      expect(css).match(/font-family:["']?list-item["']?;font-weight:600/);
      expect(css).match(/font-family:["']?archive-year["']?;font-weight:400/);
    });
  });

  it('全站分页保持左新篇、右旧闻；归档页码指向真实分页', () => {
    for (const { content } of htmlAssets) {
      const html = content.toString();
      const nav = /<nav[^>]+aria-label="文章分页"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1];

      if (!nav) {
        continue;
      }

      const newer = /<a[^>]+rel="prev"[^>]*>[\s\S]*?新篇<\/a>/.exec(nav);
      const older = /<a[^>]+rel="next"[^>]*>旧闻[\s\S]*?<\/a>/.exec(nav);
      expect(Boolean(newer || older), '缺少有方向语义的翻页链接').true;

      if (newer && older) {
        expect(newer.index).lessThan(older.index);
      }
    }
    const pageTwo = assetMap.get('/archive/1/index.html')!.toString();
    expect(pageTwo).match(/href="\/archive\/" rel="prev"/);
    expect(pageTwo).match(/href="\/archive\/2\/" rel="next"/);
    expect(pageTwo).include('aria-current="page" aria-label="第 2 页"');
  });

  it('所有列表共用页码规则：至少三页显示，中间链接指向同一列表', () => {
    const pages = new Map<string, { nav: string; newer?: string; older?: string }>();
    for (const { path, content } of htmlAssets) {
      const nav = /<nav[^>]+aria-label="文章分页"[^>]*>([\s\S]*?)<\/nav>/.exec(content.toString())?.[1];

      if (!nav) {
        continue;
      }

      pages.set(path.replace(/index\.html$/, ''), {
        nav,
        newer: /href="([^"]+)" rel="prev"/.exec(nav)?.[1],
        older: /href="([^"]+)" rel="next"/.exec(nav)?.[1],
      });
    }
    const counts = new Set<number>();
    for (const [root, first] of pages) {
      if (first.newer) {
        continue;
      }

      const urls: string[] = [];
      let url: string | undefined = root;
      while (url) {
        expect(urls, '分页形成循环').not.include(url);
        urls.push(url);
        expect(pages.has(url), `缺少分页 ${url}`).true;
        url = pages.get(url)!.older;
      }
      counts.add(urls.length);
      urls.forEach((pageUrl, index) => {
        const { nav } = pages.get(pageUrl)!;
        expect(nav.includes('aria-current="page"'), pageUrl).eq(urls.length >= 3);
        expect(/aria-label="第 \d+ 页，共 \d+ 页"/.test(nav), pageUrl).eq(urls.length >= 3);

        if (urls.length < 3) {
          return;
        }

        expect(nav).include(`aria-current="page" aria-label="第 ${index + 1} 页"`);
        for (const link of nav.matchAll(/href="([^"]+)" aria-label="第 (\d+) 页"/g)) {
          expect(link[1], pageUrl).eq(urls[Number(link[2]) - 1]);
        }
      });
    }
    expect(counts.has(2), '需要覆盖两页的列表').true;
    expect([...counts].some((count) => count >= 3), '需要覆盖至少三页的列表').true;
  });

  it('CNAME 文件存在', () => {
    const found = assetMap.has('/CNAME');
    expect(found, 'CNAME 文件不存在').true;
  });

  it('页面输出完整 HTML 文档与非空标题', () => {
    for (const { path, content } of htmlAssets) {
      const html = content.toString();
      expect(html, path).match(/^<!DOCTYPE html>/i).match(/<\/html>\s*$/);
      expect(extractTitle(html), path).not.empty;
    }
  });

  it('可索引页面包含完整的分享元数据', () => {
    const invalidMeta: string[] = [];

    for (const { path, content } of htmlAssets.filter(({ path }) => path !== '/404.html')) {
      const html = content.toString('utf-8');
      const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i.exec(html)?.[1] ?? '';
      const ogUrl = extractMetaContent(html, 'og:url');
      const ogImage = extractMetaContent(html, 'og:image');
      const requiredMeta = [
        'og:title',
        'og:description',
        'og:type',
        'og:url',
        'og:site_name',
        'og:image',
        'og:image:type',
        'og:image:width',
        'og:image:height',
        'og:image:alt',
      ];
      const imageAssetPath = ogImage ? new URL(ogImage).pathname : '';

      if (
        !requiredMeta.every((key) => extractMetaContent(html, key))
        || !canonical.startsWith('https://')
        || canonical !== ogUrl
        || !ogImage.startsWith('https://')
        || !assetMap.has(imageAssetPath)
      ) {
        invalidMeta.push(path);
      }
    }

    expect(invalidMeta).to.be.empty;
  });

  it('首页和文章页使用正确的 Open Graph 类型', () => {
    const indexHtml = assetMap.get('/index.html')!.toString('utf-8');
    const postPage = htmlAssets.find((a) => postAssetPaths.has(a.path));

    expect(extractMetaContent(indexHtml, 'og:type')).eq('website');
    expect(postPage, '没有找到文章页').not.undefined;
    expect(extractMetaContent(postPage!.content.toString('utf-8'), 'og:type')).eq('article');
  });

  it('页面允许用户缩放', () => {
    const invalidViewport = htmlAssets
      .filter(({ content }) => {
        const html = content.toString('utf-8');
        const viewport = extractMetaContent(html, 'viewport');
        return !viewport || /(?:maximum-scale|user-scalable\s*=\s*no)/i.test(viewport);
      })
      .map(({ path }) => path);

    expect(invalidViewport).to.be.empty;
  });

  it('类型提示脚本独立输出，普通文章不必加载，提示页面的 JS/CSS 不重复', () => {
    const tooltipScripts = assets.filter(({ path }) => /\/code-block-ts\.[^/]+\.js$/.test(path));
    expect(tooltipScripts).length(1);
    const tooltipPath = tooltipScripts[0].path;
    let withTooltip = 0;
    let withoutScript = 0;
    for (const { path, content } of htmlAssets.filter((asset) => postAssetPaths.has(asset.path))) {
      const html = content.toString();
      const scripts = Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g), (match) => match[1]);
      const references = scripts.filter((src) => src === tooltipPath);
      expect(references.length, path).at.most(1);

      if (html.includes(' ls-info="')) {
        withTooltip++;
        expect(references, path).length(1);
        const styles = extractLinks(html).filter((src) => /\/code-block-ts\.[^/]+\.css$/.test(src));
        expect(styles, path).length(1);
      }

      if (!references.length) {
        withoutScript++;
      }
    }
    expect(withTooltip).greaterThan(0);
    expect(withoutScript).greaterThan(0);
  });

  it('主题 CSS 合入布局且不单独输出，所有页面在样式之前同步加载独立主题脚本', () => {
    const themeScripts = assets.filter(({ path }) => /\/theme\.[^/]+\.js$/.test(path));
    const themeStyles = assets.filter(({ path }) => /\/theme\.[^/]+\.css$/.test(path));
    const layoutStyles = assets.filter(({ path }) => /\/layout\.[^/]+\.css$/.test(path));
    expect(themeScripts).length(1);
    expect(themeStyles).length(0);
    expect(layoutStyles).length(1);
    for (const { path, content } of htmlAssets) {
      const html = content.toString('utf-8');
      const head = /<head>([\s\S]*?)<\/head>/.exec(html)![1];
      const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
        .filter(([, src]) => src === themeScripts[0].path);
      expect(scripts, path).length(1);
      const tag = scripts[0][0];
      expect(head, path).include(tag);
      expect(tag, path).not.match(/\b(?:defer|async)=|type="module"/);
      const script = html.indexOf(tag);
      const stylesheet = html.indexOf('rel="stylesheet"');
      expect(stylesheet, path).greaterThan(script);
      const linkedStyles = extractLinks(head);
      expect(linkedStyles.filter((href) => href === layoutStyles[0].path), path).length(1);
      // 与运行时 [data-theme-toggle] 一致，只检查属性存在；React 会把 JSX 简写输出为 "true"。
      const buttons = [...html.matchAll(/<button\b[^>]*\sdata-theme-toggle(?=[\s=>])[^>]*>/g)];
      expect(buttons, path).length(1);
    }
  });

  it('公共资源保留 head / body 位置与标签配置，Site 和 Page 的重复引用只输出一次', () => {
    const html = assetMap.get('/index.html')!.toString();
    const head = /<head>([\s\S]*?)<\/head>/.exec(html)![1];
    const body = /<body\b[^>]*>([\s\S]*?)<\/body>/.exec(html)![1];
    const references: [string, RegExp, string, string[]][] = [
      [
        head,
        /<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g,
        sharedPreScript.src,
        ['type="module"', 'async=""', 'crossorigin="anonymous"'],
      ],
      [
        body,
        /<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g,
        sharedScript.src,
        ['defer=""'],
      ],
      [
        head,
        /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g,
        sharedStyle.href,
        ['media="print"', 'crossorigin="anonymous"'],
      ],
      [
        head,
        /<link\b[^>]*\brel="preload"[^>]*\bhref="([^"]+)"[^>]*>/g,
        sharedPreload.href,
        [
          'as="style"',
          'type="text/css"',
          'media="print"',
          'crossorigin="anonymous"',
        ],
      ],
    ];
    for (const [
      section,
      pattern,
      url,
      attributes,
    ] of references) {
      const tags = [...section.matchAll(pattern)].filter(([, src]) => src === url);
      expect(tags, url).length(1);
      for (const attribute of attributes) {
        expect(tags[0][0].toLowerCase(), url).include(attribute);
      }
    }
    expect(head.indexOf(`src="${sharedPreScript.src}"`)).lessThan(head.indexOf('rel="stylesheet"'));
  });

  it('首页、文章与 404 正式渲染时新增的资源只由各自页面引用', () => {
    expect([...resourcePages.values()].map(({ type }) => type).sort())
      .deep.eq(['index', 'not-found', 'post']);
    expect(htmlAssets.length).greaterThan(resourcePages.size);
    for (const { path, content } of htmlAssets) {
      const body = /<body\b[^>]*>([\s\S]*?)<\/body>/.exec(content.toString())![1];
      const scripts = [...body.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
        .map(([, src]) => src)
        .filter((src) => /\/test-script-[^/]+\.js$/.test(src));
      const pageScript = resourcePages.get(path)?.script;
      expect(scripts, path)
        .deep.eq(pageScript ? [sharedScript.src, pageScript.src] : [sharedScript.src]);
    }
  });
});
