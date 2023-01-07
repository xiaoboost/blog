import { expect, describe, it } from '@blog/test-toolkit';
import { getPostMetaData } from '../transformer';

describe('getPostMetaData', () => {
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
    expect(() => getPostMetaData(`---\npublic: false\n---\n\n测试内容`, file)).throw(
      `文章必须要有 title, create 字段：${file}`,
    );
  });
});
