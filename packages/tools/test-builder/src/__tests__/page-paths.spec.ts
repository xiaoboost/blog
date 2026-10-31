import assert from 'node:assert/strict';
import { describe, it } from '@blog/test-toolkit';
import { defineUtils } from '../../../../builder/context/src/runtime/hook/assets';
import { Page } from '../../../../builder/generator/src/model/page';
import { assertUniquePagePaths } from '../../../../builder/generator/src/utils/page-paths';

function postPage(pathname: string, index = 1) {
  return new Page({
    type: 'post',
    pathname,
    title: '同名文章',
    render: () => '',
    data: {
      post: {
        Component: () => null,
        utils: defineUtils(),
        data: {
          title: '同名文章',
          pathname,
          filePath: `/articles/post-${index}.md`,
          create: Date.UTC(2026, 0, 1),
          update: Date.UTC(2026, 0, 1),
          tags: [],
          public: true,
          draft: false,
          toc: false,
          lsp: false,
          template: 'post',
          description: '',
          showPageNumberInSlide: true,
          coverImage: null,
          ast: { type: 'root', children: [] },
        },
      },
    },
  });
}

const notFound = () => new Page({
  type: 'not-found',
  pathname: '/404.html',
  outputPath: '/404.html',
  title: '页面未找到',
  data: {},
  render: () => '',
});

describe('页面路径', () => {
  for (const [name, pathnames, outputPath] of [
    ['完全相同的路径', ['posts/shared', 'posts/shared'], '/posts/shared/index.html'],
    ['首尾斜杠与相对路径段', ['posts/shared', '/posts/other/../shared/'], '/posts/shared/index.html'],
    ['带扩展名的目录路径', ['posts/shared.html', '/posts/shared.html/'], '/posts/shared.html/index.html'],
  ] as const) {
    it(`${name}报错，并指出两篇文章源文件`, () => {
      const pages = pathnames.map((pathname, index) => postPage(pathname, index + 1));
      assert.throws(() => assertUniquePagePaths(pages), (error: Error) => {
        for (const text of [
          '页面路径重复',
          outputPath,
          '/articles/post-1.md',
          '/articles/post-2.md',
        ]) {
          assert.ok(error.message.includes(text), error.message);
        }
        return true;
      });
    });
  }

  const systemPages = [
    new Page({
      type: 'index',
      pathname: '/',
      title: '首页',
      data: { index: 0, count: 1, posts: [] },
      render: () => '',
    }),
    new Page({
      type: 'tag-list',
      pathname: '/tags/',
      title: '标签',
      data: {
        index: 0,
        count: 1,
        listTitle: '标签',
        items: [],
      },
      render: () => '',
    }),
  ];
  for (const page of systemPages) {
    it(`文章不能占用 ${page.pathname} 系统页面地址`, () => {
      const pages = [postPage(page.pathname), page];
      assert.throws(() => assertUniquePagePaths(pages), (error: Error) => {
        assert.ok(error.message.includes(`页面路径重复：${page.pathname}`), error.message);
        assert.ok(error.message.includes('/articles/post-1.md'), error.message);
        assert.ok(error.message.includes(`（${page.type}）`), error.message);
        return true;
      });
    });
  }

  it('标题相同但路径不同的文章保留独立的输出路径', () => {
    const pages = [postPage('posts/first'), postPage('posts/second', 2), notFound()];
    assert.doesNotThrow(() => assertUniquePagePaths(pages));
    assert.deepEqual(pages.map((page) => page.toAsset().path), ['/posts/first/index.html', '/posts/second/index.html', '/404.html']);
  });

  it('文章目录不能占用 404.html 文件或它的子目录，与输入顺序无关', () => {
    for (const pathname of ['/404.html', '/404.html/nested/']) {
      for (const pages of [[postPage(pathname), notFound()], [notFound(), postPage(pathname)]]) {
        assert.throws(() => assertUniquePagePaths(pages), (error: Error) => {
          for (const text of [
            '文件与目录冲突',
            '/404.html',
            '/articles/post-1.md',
            '（not-found）',
          ]) {
            assert.ok(error.message.includes(text), error.message);
          }
          return true;
        });
      }
    }
  });
});
