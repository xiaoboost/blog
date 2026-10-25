import assert from 'node:assert/strict';
import { expect, describe, it } from '@blog/test-toolkit';
import { getPostData } from '../post';

describe('getPostData', () => {
  it('整理文章配置并补上默认模板，正文保持原文且不提前注入资源', async () => {
    const content = "import { MathBlock } from '@blog/mdx-katex';\n\n<MathBlock>test</MathBlock>";
    const data = await getPostData(
      `---\ntitle: 标题\ncreate: 2045/01/01\nupdate: 2045/01/02\npathname: posts/test\npublic: false\n---\n\n${content}`,
      '/test/test.md',
    );
    expect(data.content).eq(content);
    expect(data.template).eq('post');
    expect(data.pathname).eq('posts/test');
    expect(data.public).false;
    expect(data).not.have.property('ast');
    expect(data).not.have.property('utils');
  });

  it('日期按 UTC 解析，不受构建机时区影响', async () => {
    const data = await getPostData(
      '---\ntitle: 标题\ncreate: 2045/01/01\nupdate: 2045-01-02\n---\n\n正文',
      '/test/test.md',
    );
    expect(data.create).eq(Date.UTC(2045, 0, 1));
    expect(data.update).eq(Date.UTC(2045, 0, 2));
  });

  it('没有 update 时与 create 保持一致，不读取文件 mtime', async () => {
    const data = await getPostData(
      '---\ntitle: 标题\ncreate: 2045/01/01\n---\n\n正文',
      '/test/not-exists.md',
    );
    expect(data.update).eq(data.create);
  });

  it('拒绝非法日期', async () => {
    await assert.rejects(
      () => getPostData(
        '---\ntitle: 标题\ncreate: 2045/02/30\n---\n\n正文',
        '/test/test.md',
      ),
      /文章日期无效：2045\/02\/30（\/test\/test.md）/,
    );
  });
});
