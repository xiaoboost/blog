import assert from 'node:assert/strict';
import { Builder } from '@blog/core';
import { describe, it } from '@blog/test-toolkit';

async function buildPages(pathnames: string[]) {
  let renderedPages = 0;
  const posts = pathnames.map((pathname, index) => ({
    title: '同名文章',
    pathname,
    filePath: `/articles/post-${index + 1}.md`,
    create: Date.UTC(2026, 0, 1),
    update: Date.UTC(2026, 0, 1),
    tags: [{ name: '测试标签', url: '' }],
    public: true,
    draft: false,
    toc: false,
    lsp: false,
    template: 'post',
    description: '路径检查测试',
    ast: { type: 'root', children: [] },
  }));
  const builder = new Builder({
    mode: 'production',
    write: false,
    logLevel: 'Silence',
    typeCheck: false,
    plugins: [
      {
        name: 'test-page-paths',
        apply(builder) {
          builder.hooks.bundler.tap('test-page-paths', (bundler) => {
            bundler.hooks.load.tap({ name: 'test-page-paths', stage: -100 }, (args) => {
              if (args.namespace !== 'posts-loader') {
                return;
              }

              // 只替换文章数据，保留实际页面生成、路径标准化与构建错误处理。
              return {
                contents: `
                import { defineUtils } from '@blog/context/runtime';
                const data = ${JSON.stringify(posts)};
                export default data.map((data) => ({ data, Component: () => null, utils: defineUtils() }));
              `,
                resolveDir: args.pluginData,
              };
            });
          });
          builder.hooks.runner.tap('test-page-paths', (runner) => {
            runner.registerHook(({ hooks }) => {
              hooks.beforePageRender.tap('test-page-paths', () => renderedPages++);
            });
          });
        },
      },
    ],
  });

  try {
    await builder.init();
    await builder.build();
    return {
      errors: builder.getErrors().map(({ message }) => message).join('\n'),
      paths: builder.getAssets().map(({ path }) => path),
      renderedPages,
    };
  }
  finally {
    await builder.stop();
  }
}

describe('页面路径冲突', function () {
  this.timeout(60_000);

  for (const [name, pathnames, outputPath] of [
    ['完全相同的路径', ['posts/shared', 'posts/shared'], '/posts/shared/index.html'],
    ['首尾斜杠与相对路径段', ['posts/shared', '/posts/other/../shared/'], '/posts/shared/index.html'],
    ['带扩展名的目录路径', ['posts/shared.html', '/posts/shared.html/'], '/posts/shared.html/index.html'],
  ] as const) {
    it(`${name}在渲染前报错，并指出两篇文章源文件`, async () => {
      const result = await buildPages([...pathnames]);
      assert.ok(result.errors.includes('页面路径重复'), result.errors);
      assert.ok(result.errors.includes(outputPath), result.errors);
      assert.ok(result.errors.includes('/articles/post-1.md'), result.errors);
      assert.ok(result.errors.includes('/articles/post-2.md'), result.errors);
      assert.equal(result.renderedPages, 0);
    });
  }

  for (const [pathname, pageType] of [['/', 'index'], ['/tags/', 'tag-list']] as const) {
    it(`文章不能占用 ${pathname} 系统页面地址`, async () => {
      const result = await buildPages([pathname]);
      assert.ok(result.errors.includes(`页面路径重复：${pathname}`), result.errors);
      assert.ok(result.errors.includes('/articles/post-1.md'), result.errors);
      assert.ok(result.errors.includes(`（${pageType}）`), result.errors);
      assert.equal(result.renderedPages, 0);
    });
  }

  it('标题相同但路径不同的文章可以正常构建', async () => {
    const result = await buildPages(['posts/first', 'posts/second']);
    assert.equal(result.errors, '');
    assert.ok(result.paths.includes('/posts/first/index.html'));
    assert.ok(result.paths.includes('/posts/second/index.html'));
    assert.ok(result.renderedPages > 0);
  });
});
