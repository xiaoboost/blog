import assert from 'node:assert/strict';
import { Builder } from '@blog/core';
import { describe, it } from '@blog/test-toolkit';
import type { PageItemData, PostBasicData } from '@blog/types';
import { before } from 'mocha';

const create = Date.UTC(2026, 0, 1);

function createPost(options: {
  title: string;
  pathname: string;
  filePath: string;
  public?: boolean;
  draft?: boolean;
  tags: string[];
  year?: number;
}): PostBasicData {
  const date = options.year ? Date.UTC(options.year, 0, 1) : create;
  return {
    title: options.title,
    pathname: options.pathname,
    filePath: options.filePath,
    create: date,
    update: date,
    tags: options.tags.map((name) => ({ name, url: '' })),
    public: options.public ?? true,
    draft: options.draft ?? false,
    toc: false,
    lsp: false,
    showPageNumberInSlide: true,
    coverImage: null,
    template: 'post',
    description: `${options.title} 的简介`,
    ast: { type: 'root', children: [] },
  };
}

async function buildPosts(posts: ReturnType<typeof createPost>[]) {
  const tags: PageItemData[] = [];
  const tagPosts: Record<string, string[]> = {};
  const postOrder: string[] = [];
  const postLists: Record<string, string[]> = {};
  const builder = new Builder({
    mode: 'production',
    write: false,
    logLevel: 'Silence',
    typeCheck: false,
    plugins: [
      {
        name: 'test-draft-visibility',
        apply(builder) {
          builder.hooks.runner.tap('test-post-order', (runner) => {
            runner.registerHook(({ hooks }) => {
              hooks.afterReady.tap('test-post-order', ({ pages }) => {
                for (const page of pages) {
                  if (page.type === 'post') {
                    postOrder.push(page.pathname);
                  }
                  else if (page.type === 'index' || page.type === 'year-post-list') {
                    postLists[page.pathname] = Array.from(
                      page.data.posts, ({ data }) => data.pathname,
                    );
                  }
                  else if (page.type === 'year-list') {
                    postLists[page.pathname] = Array.from(page.data.groups)
                      .flatMap((group) => Array.from(group.posts, ({ data }) => data.pathname));
                  }

                  if (page.type === 'tag-list') {
                    tags.push(...page.data.items.map((item) => ({ ...item })));
                  }
                  else if (page.type === 'tag-post-list') {
                    (tagPosts[page.data.listTitle] ??= []).push(
                      ...Array.from(page.data.posts, ({ data }) => data.pathname),
                    );
                  }
                }
              });
            });
          });
          builder.hooks.bundler.tap('test-draft-visibility', (bundler) => {
            bundler.hooks.load.tap({ name: 'test-draft-visibility', stage: -100 }, (args) => {
              if (args.namespace !== 'posts-loader') {
                return;
              }

              return {
                contents: `
                  import { defineUtils } from '@blog/context/runtime';
                  const data = ${JSON.stringify(posts)};
                  export default data.map((data) => ({
                    data,
                    Component: () => null,
                    utils: defineUtils(),
                  }));
                `,
                resolveDir: args.pluginData,
              };
            });
          });
        },
      },
    ],
  });

  try {
    await builder.init();
    await builder.build();
    const html = new Map(builder.getAssets()
      .filter(({ path }) => path.endsWith('.html'))
      .map(({ path, content }) => [path, content.toString()]));
    return {
      errors: builder.getErrors().map(({ message }) => message).join('\n'),
      paths: builder.getAssets().map(({ path }) => path),
      html,
      tags,
      tagPosts,
      postOrder,
      postLists,
    };
  }
  finally {
    await builder.stop();
  }
}

function pageHtml(result: Awaited<ReturnType<typeof buildPosts>>, path: string) {
  const html = result.html.get(path);
  assert.ok(html, `缺少页面 ${path}`);
  return html;
}

describe('生产文章页面（共用一次构建）', function () {
  this.timeout(120_000);
  let result: Awaited<ReturnType<typeof buildPosts>>;

  before(async () => {
    result = await buildPosts([
      createPost({
        title: 'Published Post',
        pathname: 'posts/published',
        filePath: '/articles/published.mdx',
        tags: ['Published Tag'],
      }),
      createPost({
        title: 'Draft Post',
        pathname: 'posts/draft',
        filePath: '/articles/draft.mdx',
        draft: true,
        tags: ['Draft Tag'],
      }),
      createPost({
        title: 'Unlisted Post',
        pathname: 'posts/unlisted',
        filePath: '/articles/unlisted.mdx',
        public: false,
        tags: ['Unlisted Tag'],
      }),
      // 独立年份的 41 篇同名文章，同时覆盖三页分页与同名文章的独立输出。
      ...Array.from({ length: 41 }, (_, index) => createPost({
        title: '同名文章',
        pathname: `posts/year-${index}`,
        filePath: `/articles/year-${index}.md`,
        tags: [],
        year: 2025,
      })),
    ]);

    assert.equal(result.errors, '');
  });

  it('生产构建不生成草稿页面，标记隐藏的文章仍会生成但不进入列表', () => {
    assert.ok(result.paths.includes('/posts/published/index.html'));
    assert.ok(result.paths.includes('/posts/unlisted/index.html'));
    assert.ok(!result.paths.includes('/posts/draft/index.html'), '草稿页面不应生成');

    const published = pageHtml(result, '/posts/published/index.html');
    assert.ok(published.includes('2026-01-01'), '文章日期应按 UTC 输出');
    assert.ok(published.includes('2026-01-01T00:00:00.000Z'));

    const index = pageHtml(result, '/index.html');
    assert.ok(index.includes('Published Post'));
    assert.ok(!index.includes('Draft Post'), '草稿不应进入首页');
    assert.ok(!index.includes('Unlisted Post'), '隐藏文章不应进入首页');

    const tags = pageHtml(result, '/tags/index.html');
    assert.ok(tags.includes('Published Tag'));
    assert.ok(!tags.includes('Draft Tag'), '草稿标签不应进入标签聚合页');
    assert.ok(!tags.includes('Unlisted Tag'), '隐藏文章标签不应进入标签聚合页');

    const archive = pageHtml(result, '/archive/2026/index.html');
    assert.ok(archive.includes('Published Post'));
    assert.ok(!archive.includes('Draft Post'), '草稿不应进入归档页');
    assert.ok(!archive.includes('Unlisted Post'), '隐藏文章不应进入归档页');

    for (const [path, html] of result.html) {
      assert.ok(!html.includes('Draft Post'), `草稿内容出现在 ${path}`);
    }
  });

  it('年份归档的数字分页使用原始年份，同名文章各自生成', () => {
    const urls = ['/archive/2025/', '/archive/2025/1/', '/archive/2025/2/'];
    urls.forEach((url, index) => {
      const html = pageHtml(result, `${url}index.html`);
      const nav = /<nav[^>]+aria-label="文章分页"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1];
      assert.ok(nav, `缺少分页导航 ${url}`);
      const links = [...nav.matchAll(/href="([^"]+)" aria-label="第 \d+ 页"/g)]
        .map(([, href]) => href);
      assert.deepEqual(links, urls.filter((_, i) => i !== index));
    });
    for (let index = 0; index < 41; index++) {
      assert.ok(result.html.has(`/posts/year-${index}/index.html`));
    }
  });
});

describe('文章与标签的确定性排序', function () {
  this.timeout(120_000);
  let first: Awaited<ReturnType<typeof buildPosts>>;
  let reversed: Awaited<ReturnType<typeof buildPosts>>;

  before(async () => {
    const names = [
      '游戏',
      '数据分析',
      '架构设计',
      '动画',
      '阿',
      '啊',
      'AI 编程',
    ];
    const posts = names.map((name, index) => createPost({
      title: name,
      pathname: `posts/tag-${index}`,
      filePath: `/articles/tag-${index}.md`,
      tags: [name],
    }));
    posts.push(...['a', 'Z', 'new'].map((name) => createPost({
      title: name === 'a' ? 'A title' : 'Z title',
      pathname: `posts/${name}`,
      filePath: `/articles/${name === 'a' ? 'A' : 'z'}/${name}.md`,
      tags: ['热门'],
      year: name === 'new' ? 2027 : 2026,
    })));
    first = await buildPosts(posts);
    reversed = await buildPosts(posts.toReversed());
    assert.equal(first.errors, '');
    assert.equal(reversed.errors, '');
  });

  it('按已有标签 URL 排序，不依赖文章数量和输入顺序', () => {
    assert.deepEqual(first.tags.map(({ title }) => title), [
      '啊',
      '阿',
      'AI 编程',
      '动画',
      '架构设计',
      '热门',
      '数据分析',
      '游戏',
    ]);
    assert.equal(first.tags.find(({ title }) => title === '热门')?.subTitle, '共 3 篇');
    assert.deepEqual(first.tags, reversed.tags);
    assert.equal(pageHtml(first, '/tags/index.html'), pageHtml(reversed, '/tags/index.html'));
  });

  it('标签内按发布时间降序，同时间按 pathname 字符顺序排列', () => {
    assert.deepEqual(first.tagPosts['热门'], ['/posts/new/', '/posts/Z/', '/posts/a/']);
    assert.deepEqual(first.tagPosts, reversed.tagPosts);
  });

  it('文章页、首页和归档共用创建时间与 pathname 顺序，不受标题和文件路径影响', () => {
    const expected = [
      '/posts/new/',
      '/posts/Z/',
      '/posts/a/',
      ...Array.from({ length: 7 }, (_, index) => `/posts/tag-${index}/`),
    ];
    assert.deepEqual(first.postOrder, expected);
    assert.deepEqual(first.postLists['/'], expected);
    assert.deepEqual(first.postLists['/archive/'], expected);
    assert.deepEqual(first.postLists['/archive/2027/'], expected.slice(0, 1));
    assert.deepEqual(first.postLists['/archive/2026/'], expected.slice(1));
    assert.deepEqual(first.postOrder, reversed.postOrder);
    assert.deepEqual(first.postLists, reversed.postLists);
    assert.deepEqual(first.html, reversed.html);
  });

  it('标签 URL 保持原有带声调拼音规则', () => {
    assert.equal(first.tags.find(({ title }) => title === '架构设计')?.url, '/tags/jia4-gou4-she4-ji4/');
    assert.equal(first.tags.find(({ title }) => title === 'AI 编程')?.url, '/tags/ai-bian1-cheng2/');
  });
});
