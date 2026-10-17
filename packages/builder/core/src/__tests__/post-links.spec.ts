import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { normalize } from '@blog/node';
import { compile, parse } from '@blog/parser';
import { build } from 'esbuild';
import { before, describe, it } from 'mocha';

const templateRoot = resolve(__dirname, '../../../../templates/post/src');
const section = '演出与文本：克制化的表达';
const sectionHash = '%e6%bc%94%e5%87%ba%e4%b8%8e%e6%96%87%e6%9c%ac%ef%bc%9a%e5%85%8b%e5%88%b6%e5%8c%96%e7%9a%84%e8%a1%a8%e8%be%be';
const summaryHash = '%e6%80%bb%e7%bb%93';
const sectionFragment = `#${encodeURIComponent(sectionHash)}`;
const summaryFragment = `#${encodeURIComponent(summaryHash)}`;
const fixtures = {
  source: [
    '## 总结',
    '[同文](#总结)',
    '[阅读全文](../鸣潮_拉海洛/index.mdx "作者写的提示")',
    `[跨文](../鸣潮_拉海洛/index.mdx?from=source&view=full#${section})`,
    `[“克制化的表达”](../鸣潮_拉海洛/index.mdx#${section})`,
    `[《拉海洛篇》](../鸣潮_拉海洛/index.mdx#${section})`,
    `[*克制*与 \`表达\`](../鸣潮_拉海洛/index.mdx#${section})`,
    `[编码](../鸣潮_拉海洛/index.mdx#${sectionHash.toUpperCase()})`,
    `[完整链接编码](../鸣潮_拉海洛/index.mdx${sectionFragment})`,
    '[重复](../鸣潮_拉海洛/index.mdx#总结-1)',
    '[未知章节](../鸣潮_拉海洛/index.mdx#custom-anchor)',
    '[未知文章](../missing/index.mdx#custom-anchor)',
    '[外链](https://example.com/post#custom-anchor)',
    '## 总结',
  ].join('\n\n'),
  target: `## ${section}\n\n## 总结\n\n## 总结`,
  levels: '###### 总结\n\n## 总结\n\n## **格式** `标题`',
};

interface Heading {
  content: string;
  hash: string;
  level: number;
}

interface Harness {
  splitPostHref(href: string): { path: string; query: string; fragment: string };
  resolveHeadingFragment(fragment: string, headings: Heading[]): string;
  render(name: keyof typeof fixtures, toc: boolean): string;
  headings(name: keyof typeof fixtures): Heading[];
}

async function createHarness(): Promise<Harness> {
  const fixtureData = await Promise.all(Object.entries(fixtures).map(async ([name, source]) => {
    const filePath = normalize(templateRoot, 'fixtures', name === 'target' ? '鸣潮_拉海洛' : name, 'index.mdx');
    return [
      name,
      {
        filePath,
        pathname: `/posts/${name}/`,
        title: name === 'target' ? '拉海洛' : name,
        create: 0,
        ast: await parse(filePath, source),
      },
    ];
  }));
  const result = await build({
    stdin: {
      contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { Post } from './post';
        import { setCurrentPost, setPosts } from '@blog/context/runtime';
        import { getHeadingAnchors } from './to-content/utils';
        import source from 'fixture:source';
        import target from 'fixture:target';
        import levels from 'fixture:levels';
        export { splitPostHref, resolveHeadingFragment } from './post/link-utils';
        const data = ${JSON.stringify(Object.fromEntries(fixtureData))};
        const components = { source, target, levels };
        setPosts(Object.values(data));
        export function headings(name) { return getHeadingAnchors(data[name].ast); }
        export function render(name, toc) {
          const post = { data: { ...data[name], toc }, Component: components[name] };
          setCurrentPost(post);
          return renderToStaticMarkup(<Post post={post} />);
        }
      `,
      loader: 'tsx',
      resolveDir: templateRoot,
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    nodePaths: [resolve(__dirname, '../../../generator/node_modules')],
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'post-link-test-fixtures',
        setup(bundler) {
          // 保留真实 MDX、Post、标题、目录和链接，只替换无关样式及页面外壳。
          bundler.onResolve({ filter: /^@blog\/node$/ }, () => ({
            path: resolve(__dirname, '../../../../utils/node/src/path.ts'),
          }));
          bundler.onResolve({ filter: /\.jss$|^@blog\/(context\/runtime|template-layout|icons)$/ }, ({ path }) => ({ path, namespace: 'stub' }));
          bundler.onResolve({ filter: /^\.\/(image|code)$/ }, ({ path }) => ({ path, namespace: 'stub' }));
          bundler.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => {
            if (path === '@blog/context/runtime') {
              return {
                contents: `
              let currentPost;
              let afterPostDataReady;
              export function onBuild(callback) {
                callback({ hooks: { afterPostDataReady: { tap(_, fn) { afterPostDataReady = fn; } } } });
              }
              export function setPosts(posts) { afterPostDataReady(posts); }
              export function setCurrentPost(post) { currentPost = post; }
              export function useRenderContext() { return { page: { data: { post: currentPost } } }; }
            `,
              };
            }

            if (path === '@blog/template-layout') {
              return { contents: 'export function Layout({ children }) { return children; }' };
            }

            if (path === '@blog/icons') {
              return { contents: 'export const Circle = () => null; export const Quote = () => null;' };
            }

            if (path === './code') {
              return { contents: 'export const Pre = () => null;' };
            }

            return { contents: 'export default { classes: {} };' };
          });
          bundler.onResolve({ filter: /^fixture:/ }, ({ path }) => ({ path, namespace: 'fixture' }));
          bundler.onLoad({ filter: /.*/, namespace: 'fixture' }, async ({ path }) => ({
            contents: await compile(fixtures[path.slice('fixture:'.length) as keyof typeof fixtures]),
            loader: 'jsx',
            resolveDir: templateRoot,
          }));
        },
      },
    ],
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require,
    TextEncoder,
  });
  return module.exports as Harness;
}

function headingIds(html: string): string[] {
  return Array.from(html.matchAll(/<h[1-6]\b[^>]*\bid="([^"]+)"/g), (match) => match[1]);
}

describe('文章章节链接', function () {
  this.timeout(15000);
  let harness: Harness;

  before(async () => {
    harness = await createHarness();
  });

  it('只拆分路径、查询和片段，查询中的编码及片段中的问号保持原样', () => {
    const result = harness.splitPostHref('../%E6%96%87%E7%AB%A0/index.mdx?from=a%23b#标题?问题');
    assert.equal(result.path, '../%E6%96%87%E7%AB%A0/index.mdx');
    assert.equal(result.query, '?from=a%23b');
    assert.equal(result.fragment, '#标题?问题');
    assert.equal(harness.splitPostHref('#总结').path, '');
  });

  it('识别中文、单层及双层编码和重复标题后缀，未知或损坏片段不会报错', () => {
    const headings = harness.headings('target');
    const inputs = [
      `#${section}`,
      `#${sectionHash}`,
      `#${sectionHash.toUpperCase()}`,
      sectionFragment,
      `#${encodeURIComponent(sectionHash.toUpperCase())}`,
    ];
    for (const fragment of inputs) {
      const resolved = harness.resolveHeadingFragment(fragment, headings);
      assert.equal(resolved, sectionFragment);
      assert.equal(decodeURIComponent(resolved.slice(1)), sectionHash);
    }
    assert.equal(harness.resolveHeadingFragment('#总结-1', headings), `${summaryFragment}-1`);
    assert.equal(harness.resolveHeadingFragment(`#${summaryHash}-1`, headings), `${summaryFragment}-1`);
    assert.equal(harness.resolveHeadingFragment(`${summaryFragment}-1`, headings), `${summaryFragment}-1`);
    assert.equal(harness.resolveHeadingFragment('#custom-anchor', headings), '#custom-anchor');
    assert.equal(harness.resolveHeadingFragment('#%E6%ZZ', headings), '#%E6%ZZ');
    assert.equal(harness.resolveHeadingFragment('', headings), '');
  });

  it('实际编译的 MDX 跨文链接与目标正文 ID 相符，并保留查询、作者文字和提示', () => {
    const html = harness.render('source', false);
    const target = harness.render('target', false);
    assert.ok(headingIds(target).includes(sectionHash));
    assert.ok(headingIds(target).includes(`${summaryHash}-1`));
    assert.ok(html.includes(`href="/posts/target/?from=source&amp;view=full${sectionFragment}"`));
    assert.ok(html.includes(`href="/posts/target/${sectionFragment}"`));
    assert.ok(html.includes(`href="/posts/target/${summaryFragment}-1"`));
    const links = Array.from(html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g));
    const fullPostLink = links.find((link) => link[2] === '阅读全文');
    assert.ok(fullPostLink);
    assert.ok(fullPostLink[1].includes('href="/posts/target/"'));
    assert.ok(fullPostLink[1].includes('title="作者写的提示"'));
    for (const label of [
      '跨文',
      '“克制化的表达”',
      '《拉海洛篇》',
      '<em>克制</em>与 <code>表达</code>',
    ]) {
      const link = links.find((item) => item[2] === label);
      assert.ok(link, `链接正文保留作者写法：${label}`);
      assert.ok(link[1].includes(sectionFragment));
    }
    assert.ok(html.includes('href="/posts/target/#custom-anchor"'));
    assert.ok(html.includes('href="../missing/index.mdx#custom-anchor"'));
    assert.ok(html.includes('href="https://example.com/post#custom-anchor"'));
    const samePageLink = html.match(/<a\b[^>]*>同文<\/a>/)?.[0];
    assert.ok(samePageLink);
    assert.ok(samePageLink.includes(`href="${summaryFragment}"`));
    assert.ok(!samePageLink.includes('target="_blank"'));
  });

  it('无目录文章、多次渲染及目录生成互不串号，正文链接不消耗标题序号', () => {
    const first = harness.render('source', false);
    assert.deepEqual(headingIds(first), [summaryHash, `${summaryHash}-1`]);
    assert.deepEqual(headingIds(harness.render('target', false)), [sectionHash, summaryHash, `${summaryHash}-1`]);
    assert.equal(harness.render('source', false), first);
    const withToc = harness.render('source', true);
    assert.deepEqual(headingIds(withToc), headingIds(first));
    const nav = withToc.slice(withToc.indexOf('<nav'));
    assert.ok(nav.includes(`href="${summaryFragment}"`));
    assert.ok(nav.includes(`href="${summaryFragment}-1"`));
    assert.equal(harness.render('source', false), first);
  });

  it('目录省略的六级标题仍参与计数，带格式的标题与 AST 提取一致', () => {
    const html = harness.render('levels', true);
    const headings = harness.headings('levels');
    assert.deepEqual(headingIds(html), [summaryHash, `${summaryHash}-1`, '%e6%a0%bc%e5%bc%8f%20%e6%a0%87%e9%a2%98']);
    assert.equal(headings[2].content, '格式 标题');
    const nav = html.slice(html.indexOf('<nav'));
    assert.ok(nav.includes(`href="${summaryFragment}-1"`));
    assert.ok(!nav.includes(`href="${summaryFragment}"`));
  });

  it('跨文、同文、正文节标及目录的 URL 片段解码后等于目标 HTML ID', () => {
    const targetIds = headingIds(harness.render('target', false));
    const source = harness.render('source', true);
    const sourceIds = headingIds(source);
    let matchedLinks = 0;

    for (const match of source.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const href = match[1];
      const hash = href.indexOf('#');
      const isCrossPost = href.startsWith('/posts/target/');

      if (hash < 0 || href.endsWith('#custom-anchor') || (!isCrossPost && !href.startsWith('#'))) {
        continue;
      }

      const id = decodeURIComponent(href.slice(hash + 1));
      assert.ok((isCrossPost ? targetIds : sourceIds).includes(id), `URL 片段应解码为现有 ID：${href}`);
      matchedLinks++;
    }

    assert.equal(matchedLinks, 12, '包含 7 条跨文章节链接、1 条同文链接、2 个正文节标和 2 条目录链接');
  });
});
