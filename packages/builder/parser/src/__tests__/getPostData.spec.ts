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
});
