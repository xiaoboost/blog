import { expect, describe, it } from '@blog/test-toolkit';
import { getPostMetaData } from '../post';

describe('getPostMetaData', () => {
  it('rejects a non-boolean LSP setting', () => {
    const file = '/test/test.md';
    expect(() => getPostMetaData('---\ntitle: 标题\ncreate: 2045/01/01\nlsp: "false"\n---\n正文', file))
      .throw(`文章 lsp 配置必须是布尔值：${file}`);
  });

  it('basic', () => {
    expect(
      getPostMetaData(
        `
---
title: 标题
create: 2045/01/01
pathname: posts/test
public: false
---

测试内容
      `.trim(),
        '/test/test.md',
      ),
    ).deep.eq({
      title: '标题',
      create: '2045/01/01',
      pathname: 'posts/test',
      public: false,
      content: '测试内容',
    });
  });

  it('post config error', () => {
    const file = '/test/test.md';
    expect(() => getPostMetaData('', file)).throw(`文件格式错误: ${file}`);
  });

  it('post config missing prop', () => {
    const file = '/test/test.md';
    expect(() => getPostMetaData('---\npublic: false\n---\n\n测试内容', file)).throw(
      `文章必须要有 title, create 字段：${file}`,
    );
  });
});
