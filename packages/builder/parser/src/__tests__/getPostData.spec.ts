import { expect, describe, it } from '@blog/test-toolkit';
import { getPostData as origin } from '../post';

const fileName = '/test/test.md';
const commonData = {
  title: '标题',
  pathname: 'posts/test',
  public: false,
  toc: true,
  lsp: false,
  draft: false,
  tags: [],
  filePath: fileName,
  template: 'post',
  description: '测试内容',
};

function getPostContent(content: string) {
  return `---\ntitle: 标题\ncreate: 2045/01/01\nupdate: 2045/01/02\npathname: posts/test\npublic: false\n---\n\n${content}`;
}

function getPostData(content: string) {
  return origin(getPostContent(content), fileName).then(({ create, update, ...rest }) => rest);
}

describe('getPostData', () => {
  for (const lsp of [true, false]) {
    it(`preserves the article LSP default: ${lsp}`, async () => {
      const content = getPostContent('测试内容').replace('public: false', `public: false\nlsp: ${lsp}`);
      expect((await origin(content, fileName)).lsp).eq(lsp);
    });
  }

  it('只整理配置和正文，不提前解析或注入资源', async () => {
    expect(await getPostData('测试内容')).deep.eq({ ...commonData, content: '测试内容' });
  });

  for (const content of [
    "import { MathBlock } from '@blog/mdx-katex';\n\n测试内容\n\n<MathBlock>test</MathBlock>",
    '测试内容\n\n![测试图片](../images/img.jpg)',
    "import { MathBlock } from '@blog/mdx-katex';\nimport { BookSummary } from '@blog/mdx-book-summary';\n\n测试内容<BookSummary />",
  ]) {
    it(`保留正文原文：${content.split('\n')[0]}`, async () => {
      expect(await getPostData(content)).deep.eq({
        ...commonData, content, description: content.replace(/[\n\r]/g, ''),
      });
    });
  }
});
