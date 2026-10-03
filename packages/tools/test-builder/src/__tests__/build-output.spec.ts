import { Builder } from '@blog/core';
import { expect, describe, it } from '@blog/test-toolkit';
import type { AssetData, IResourceSet, PageType, ScriptAssetData, StyleAssetData } from '@blog/types';
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
  return [
    normalized, `${normalized}/index.html`, `${normalized}.html`,
  ];
}

describe('博客构建 e2e', () => {
  let assets: AssetData[] = [];
  let assetMap = new Map<string, Buffer>();
  let htmlAssets: AssetData[] = [];
  let errors: string[] = [];
  const resourcePages = new Map<string, {
    type: PageType;
    preScript: ScriptAssetData;
    script: ScriptAssetData;
    style: StyleAssetData;
  }>();
  const sharedPreScripts: ScriptAssetData[] = [];
  const sharedScripts: ScriptAssetData[] = [];
  const sharedStyles: StyleAssetData[] = [];

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
                hooks.afterReady.tap('test-resource-config', ({ site, pages, rename }) => {
                  const addAsset = (resources: IResourceSet, name: string) => {
                    const content = Buffer.from(name.endsWith('.css')
                      ? `:root{--${name.slice(0, -4)}:1}`
                      : `window.testScriptAsset = ${JSON.stringify(name)};`);
                    const path = rename({ path: name, content });
                    resources.addAsset({ path, content });
                    return path;
                  };
                  sharedPreScripts.push(
                    { src: addAsset(site, 'test-pre-sync.js') },
                    { src: addAsset(site, 'test-pre-defer.js'), defer: true },
                    {
                      src: addAsset(site, 'test-pre-module.js'),
                      type: 'module',
                      async: true,
                      crossOrigin: 'anonymous',
                    },
                  );
                  sharedScripts.push(
                    { src: addAsset(site, 'test-script-sync.js'), defer: false, async: false },
                    { src: addAsset(site, 'test-script-defer.js'), defer: true },
                    {
                      src: addAsset(site, 'test-script-module.js'),
                      type: 'module',
                      async: true,
                      crossOrigin: 'anonymous',
                    },
                  );
                  sharedStyles.push(
                    { href: addAsset(site, 'test-style-default.css') },
                    { href: addAsset(site, 'test-style-print.css'), media: 'print' },
                    {
                      href: addAsset(site, 'test-style-screen.css'),
                      media: 'screen and (min-width: 768px)',
                      crossOrigin: 'anonymous',
                    },
                  );
                  sharedPreScripts.forEach((script) => site.addPreScript(script));
                  sharedScripts.forEach((script) => site.addScript(script));
                  sharedStyles.forEach((style) => site.addStyle(style));
                  site.addPreScript({ ...sharedPreScripts[0] });
                  site.addScript({ ...sharedScripts[0] });
                  site.addStyle({ ...sharedStyles[0] });

                  // 每种页面只选一页，验证所有渲染入口及页面之间的隔离。
                  const selected = new Set<PageType>();
                  for (const page of pages) {
                    if (selected.has(page.type)) continue;
                    selected.add(page.type);
                    const preScript: ScriptAssetData = {
                      src: addAsset(page, `test-pre-${page.type}.js`),
                      defer: true,
                    };
                    const script: ScriptAssetData = {
                      src: addAsset(page, `test-script-${page.type}.js`),
                      defer: true,
                      crossOrigin: 'use-credentials',
                    };
                    const style: StyleAssetData = {
                      href: addAsset(page, `test-style-${page.type}.css`),
                      media: 'print',
                      crossOrigin: 'use-credentials',
                    };
                    resourcePages.set(page.toAsset().path, {
                      type: page.type, preScript, script, style,
                    });
                    page.addPreScript(preScript);
                    page.addScript(script);
                    page.addStyle(style);
                  }
                });
              });
            });
          },
        },
      ],
    });

    await builder.init();
    await builder.build();

    const buildErrors = builder.getErrors();
    if (buildErrors.length > 0) {
      errors = buildErrors.map((e) => `${e.name}: ${e.message}`);
    }

    assets = builder.getAssets();
    assetMap = new Map(assets.map((a) => [a.path, a.content]));
    htmlAssets = assets.filter((a) => a.path.endsWith('.html'));
  });

  // ── 烟雾测试 ──────────────────────────────────────

  it('构建成功无错误', () => {
    expect(errors, errors.join('\n')).to.be.empty;
  });

  it('构建产物不为空', () => {
    expect(assets.length).to.be.greaterThan(0);
    expect(htmlAssets.length).to.be.greaterThan(0);
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

  // ── ② 资源引用闭合 ────────────────────────────────

  it('所有 HTML 引用的 CSS/JS 文件存在', () => {
    const missingAssets: string[] = [];

    for (const { path, content } of htmlAssets) {
      const html = content.toString('utf-8');

      const cssRegex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi;
      const jsRegex = /<script[^>]+src="([^"]+)"/gi;

      for (const regex of [cssRegex, jsRegex]) {
        for (const match of html.matchAll(regex)) {
          const src = match[1];
          if (/^(https?:|\/\/)/i.test(src)) continue;

          const assetPath = src.startsWith('/') ? src : `/${src}`;
          if (!assetMap.has(assetPath)) {
            missingAssets.push(`${path} → ${src}`);
          }
        }
      }
    }

    expect(missingAssets).to.be.empty;
  });

  // ── ③ 首页存在且非空 ──────────────────────────────

  it('首页 index.html 存在', () => {
    const indexPath = assetMap.get('/index.html');
    expect(indexPath, '首页不存在').not.undefined;
  });

  it('首页内容非空', () => {
    const content = assetMap.get('/index.html')!;
    expect(content.length).to.be.greaterThan(1000);
  });

  it('首页包含标题', () => {
    const html = assetMap.get('/index.html')!.toString('utf-8');
    expect(extractTitle(html)).not.empty;
  });

  // ── ④ 每篇文章都有对应 HTML ───────────────────────

  it('文章页面均生成', () => {
    // 文章路径格式: /posts/<year>/<slug>/index.html
    const postPages = htmlAssets.filter((a) => /^\/posts\/.+\/.+\/index\.html$/.test(a.path));
    expect(postPages.length, '没有生成任何文章页面').to.be.greaterThan(0);
  });

  it('每篇文章 HTML 都包含文章标题', () => {
    const postPages = htmlAssets.filter((a) => /^\/posts\/.+\/.+\/index\.html$/.test(a.path));
    const emptyTitles: string[] = [];

    for (const { path, content } of postPages) {
      if (!extractTitle(content.toString('utf-8'))) {
        emptyTitles.push(path);
      }
    }

    expect(emptyTitles).to.be.empty;
  });

  it('每篇文章 HTML 都包含实际内容', () => {
    const postPages = htmlAssets.filter((a) => /^\/posts\/.+\/.+\/index\.html$/.test(a.path));
    const tooSmall: string[] = [];

    for (const { path, content } of postPages) {
      if (content.length < 500) {
        tooSmall.push(path);
      }
    }

    expect(tooSmall).to.be.empty;
  });

  // ── ⑤ 关键页面存在 ────────────────────────────────

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
      extractLinks(html).filter((href) => /^\/posts\/\d{4}\//.test(href))
    );
    const actual: string[] = [];
    pages.forEach(({ content }, index) => {
      const links = postLinks(content.toString());
      expect(links.length).to.be.within(1, 12);
      if (index < pages.length - 1) expect(links.length).eq(12);
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
      if (!nav) continue;
      const newer = /<a[^>]+rel="prev"[^>]*>[\s\S]*?新篇<\/a>/.exec(nav);
      const older = /<a[^>]+rel="next"[^>]*>旧闻[\s\S]*?<\/a>/.exec(nav);
      expect(Boolean(newer || older), '缺少有方向语义的翻页链接').true;
      if (newer && older) expect(newer.index).lessThan(older.index);
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
      if (!nav) continue;
      pages.set(path.replace(/index\.html$/, ''), {
        nav,
        newer: /href="([^"]+)" rel="prev"/.exec(nav)?.[1],
        older: /href="([^"]+)" rel="next"/.exec(nav)?.[1],
      });
    }
    const counts = new Set<number>();
    for (const [root, first] of pages) {
      if (first.newer) continue;
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
        if (urls.length < 3) return;
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

  // ── ⑥ HTML 基础结构 ───────────────────────────────

  it('所有 HTML 文件以 DOCTYPE 开头', () => {
    const missingDoctype: string[] = [];

    for (const { path, content } of htmlAssets) {
      const html = content.toString('utf-8');
      if (!/^\s*<!DOCTYPE\s+html/i.test(html)) {
        missingDoctype.push(path);
      }
    }

    expect(missingDoctype).to.be.empty;
  });

  it('所有 HTML 文件包含 </html>', () => {
    const missingClose: string[] = [];

    for (const { path, content } of htmlAssets) {
      if (!/<\/html>\s*$/im.test(content.toString('utf-8'))) {
        missingClose.push(path);
      }
    }

    expect(missingClose).to.be.empty;
  });

  it('所有 HTML 文件包含非空 <title>', () => {
    const missingTitle: string[] = [];

    for (const { path, content } of htmlAssets) {
      if (!extractTitle(content.toString('utf-8'))) {
        missingTitle.push(path);
      }
    }

    expect(missingTitle).to.be.empty;
  });

  it('所有 HTML 文件包含完整的分享元数据', () => {
    const invalidMeta: string[] = [];

    for (const { path, content } of htmlAssets) {
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
    const postPage = htmlAssets.find((a) => /^\/posts\/.+\/.+\/index\.html$/.test(a.path));

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

  it('交互式正文组件使用原生按钮和可访问状态', () => {
    const html = htmlAssets.map(({ content }) => content.toString('utf-8')).join('\n');
    const disclosureButtons = html.match(
      /<button[^>]+type="button"[^>]+aria-controls="[^"]+"[^>]+aria-expanded="false"/gi,
    ) ?? [];

    expect(disclosureButtons.length).to.be.greaterThan(0);
    expect(html).to.include('aria-hidden="true"');
  });

  it('布局脚本不包含未使用的样式常量和开发环境初始化', () => {
    const layoutScript = assets.find(({ path }) => /\/layout\.[^/]+\.js$/.test(path));
    expect(layoutScript, '没有找到布局脚本').not.undefined;

    const code = layoutScript!.content.toString('utf-8');
    expect(code).not.include('--color-text-primary');
    expect(code).not.include('--duration-normal');
    expect(code).not.include('@media only screen');
    expect(code).not.include('__ModuleLoader');
    expect(code).not.include('try{const theme=localStorage.getItem(');
    // 只用桌面判断，不应带入全局 device、方向监听或电视识别。
    expect(code).not.include('window.device');
    expect(code).not.include('onorientationchange');
    expect(code).not.include('googletv');
    // 主题初始化和切换已移到独立的 head 脚本。
    expect(code).not.include('blog-theme');
  });

  it('类型提示脚本独立输出，普通文章不必加载，提示页面的 JS/CSS 不重复', () => {
    const tooltipScripts = assets.filter(({ path }) => /\/code-block-ts\.[^/]+\.js$/.test(path));
    expect(tooltipScripts).length(1);
    const tooltipPath = tooltipScripts[0].path;
    const postScript = assets.find(({ path }) => /\/post\.[^/]+\.js$/.test(path));
    expect(postScript!.content.toString()).not.include('ls-info');
    let withTooltip = 0;
    let withoutScript = 0;
    for (const { path, content } of htmlAssets.filter((asset) => asset.path.startsWith('/posts/'))) {
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
      if (!references.length) withoutScript++;
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
    const themeCode = themeScripts[0].content.toString();
    expect(themeCode).include('blog-theme');
    expect(themeCode).include('DOMContentLoaded');
    expect(themeCode).not.include('__ModuleLoader');
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
      expect(extractLinks(head).filter((href) => href === layoutStyles[0].path), path).length(1);
      const buttons = [...html.matchAll(/<button\b[^>]*\bdata-theme-toggle=""[^>]*>/g)];
      expect(buttons, path).length(1);
      const toggleClass = /\bclass="([^"]+)"/.exec(buttons[0][0])![1];
      const themeStyleOwners = assets.filter((asset) => (
        asset.path.endsWith('.css') && asset.content.toString().includes(`.${toggleClass}`)
      ));
      expect(themeStyleOwners.map((asset) => asset.path), path).deep.eq([layoutStyles[0].path]);
      expect(html, path).not.include('try{const theme=localStorage.getItem(');
    }
  });

  it('所有页面类型通过 head 引用普通脚本产物，保留配置和顺序且不泄漏页面专属引用', () => {
    expect([...resourcePages.values()].map(({ type }) => type).sort()).deep.eq([
      'index', 'post', 'tag-list', 'tag-post-list', 'year-list', 'year-post-list',
    ]);
    expect(htmlAssets.length).greaterThan(resourcePages.size);

    for (const { path, content } of htmlAssets) {
      const html = content.toString();
      const head = /<head>([\s\S]*?)<\/head>/.exec(html)![1];
      const scripts = [...head.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
        .filter(([, src]) => !/\/theme\.[^/]+\.js$/.test(src));
      const pageScript = resourcePages.get(path)?.preScript;
      const expected = pageScript ? [...sharedPreScripts, pageScript] : sharedPreScripts;
      expect(scripts.map((match) => match[1]), path).deep.eq(expected.map(({ src }) => src));
      scripts.forEach(([tag, src], index) => {
        const config = expected[index];
        expect(head.indexOf(tag), path).lessThan(head.indexOf('rel="stylesheet"'));
        expect(/\bdefer=""/.test(tag), path).eq(Boolean(config.defer));
        expect(/\basync=""/.test(tag), path).eq(Boolean(config.async));
        expect(tag, path).include(`type="${config.type ?? 'text/javascript'}"`);
        if (config.crossOrigin) expect(tag, path).match(/\bcrossorigin="anonymous"/i);
        expect(assetMap.has(src), `${path} 引用的脚本未输出：${src}`).true;
        expect(assetMap.get(src)!.toString()).include('window.testScriptAsset');
      });
      expect(html, path).not.include('window.testScriptAsset');
    }
  });

  it('所有页面类型的 body 脚本保留标签配置、去重和页面隔离', () => {
    for (const { path, content } of htmlAssets) {
      const html = content.toString();
      const body = /<body>([\s\S]*?)<\/body>/.exec(html)![1];
      const scripts = [...body.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
        .filter(([, src]) => /\/test-script-[^/]+\.js$/.test(src));
      const pageScript = resourcePages.get(path)?.script;
      const expected = pageScript ? [...sharedScripts, pageScript] : sharedScripts;
      expect(scripts.map((match) => match[1]), path).deep.eq(expected.map(({ src }) => src));
      scripts.forEach(([tag, src], index) => {
        const config = expected[index];
        expect(/\bdefer=""/.test(tag), path).eq(Boolean(config.defer));
        expect(/\basync=""/.test(tag), path).eq(Boolean(config.async));
        expect(tag, path).include(`type="${config.type ?? 'text/javascript'}"`);
        expect(/\bcrossorigin="([^"]+)"/i.exec(tag)?.[1], path).eq(config.crossOrigin);
        expect(assetMap.has(src), `${path} 引用的脚本未输出：${src}`).true;
      });
    }
  });

  it('所有页面类型的样式保留媒体条件、跨域配置、去重和页面隔离', () => {
    for (const { path, content } of htmlAssets) {
      const head = /<head>([\s\S]*?)<\/head>/.exec(content.toString())![1];
      const styleTags = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g;
      const styles = [...head.matchAll(styleTags)]
        .filter(([, href]) => /\/test-style-[^/]+\.css$/.test(href));
      const pageStyle = resourcePages.get(path)?.style;
      const expected = pageStyle ? [...sharedStyles, pageStyle] : sharedStyles;
      expect(styles.map((match) => match[1]), path).deep.eq(expected.map(({ href }) => href));
      styles.forEach(([tag, href], index) => {
        const config = expected[index];
        expect(tag, path).include('type="text/css"');
        expect(/\bmedia="([^"]+)"/.exec(tag)?.[1], path).eq(config.media);
        expect(/\bcrossorigin="([^"]+)"/i.exec(tag)?.[1], path).eq(config.crossOrigin);
        expect(assetMap.has(href), `${path} 引用的样式未输出：${href}`).true;
      });
    }
  });

  it('产物中没有 esbuild 虚拟路径', () => {
    const virtualPaths = assets.filter((a) => a.path.includes('virtual'));
    expect(virtualPaths).to.be.empty;
  });
});
