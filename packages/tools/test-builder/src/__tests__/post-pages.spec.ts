import assert from 'node:assert/strict';
import { Builder } from '@blog/core';
import { describe, it } from '@blog/test-toolkit';
import type { PostBasicData } from '@blog/types';
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
  const builder = new Builder({
    mode: 'production',
    write: false,
    logLevel: 'Silence',
    typeCheck: false,
    plugins: [
      {
        name: 'test-draft-visibility',
        apply(builder) {
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
