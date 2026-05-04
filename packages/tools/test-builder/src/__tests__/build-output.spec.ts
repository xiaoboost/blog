import { expect, describe, it } from '@blog/test-toolkit';
import { before } from 'mocha';
import { Builder } from '@blog/core';
import type { AssetData } from '@blog/types';

/**
 * HTML 链接提取：从 HTML 中提取所有 href 和 src
 * 忽略外部 URL、锚点、mailto、data URI
 */
function extractLinks(html: string): string[] {
  const links: string[] = [];
  const attrRegex = /\b(?:href|src)="([^"]+)"/gi;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(html)) !== null) {
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

  before(async function () {
    this.timeout(120_000);

    const builder = new Builder({
      mode: 'production',
      write: false,
      logLevel: 'Silence',
      typeCheck: false,
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
        let match: RegExpExecArray | null;
        while ((match = regex.exec(html)) !== null) {
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

  it('产物中没有 esbuild 虚拟路径', () => {
    const virtualPaths = assets.filter((a) => a.path.includes('virtual'));
    expect(virtualPaths).to.be.empty;
  });
});
