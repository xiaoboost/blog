import { expect, describe, it } from '@blog/test-toolkit';
import { getPostData as origin } from '../transformer';

const fileName = '/test/test.md';
const commonData = {
  title: '标题',
  pathname: 'posts/test',
  public: false,
  toc: true,
  tags: [],
  filePath: fileName,
  template: 'post',
  description: '测试内容',
  create: 2366812800000,
  update: 2366899200000,
};

function getPostContent(content: string) {
  return `
---
title: 标题
create: 2045/01/01
update: 2045/01/02
pathname: posts/test
public: false
---

${content}
  `.trim();
}

function getPostData(content: string) {
  return origin(getPostContent(content), fileName).then(({ ast, ...rest }) => rest);
}

describe('getPostData', () => {
  it('only template', async () => {
    expect(await getPostData('测试内容')).deep.eq({
      ...commonData,
      content: `
import { utils as template } from '@blog/template-post';
import { defineUtils } from '@blog/context/runtime';
export const utils = defineUtils(template.getAssetNames());

测试内容
      `.trim(),
    });
  });

  it('template and component', async () => {
    expect(
      await getPostData(
        `
import { MathBlock } from '@blog/mdx-katex';

测试内容

<MathBlock>test</MathBlock>

测试内容
    `.trim(),
      ),
    ).deep.eq({
      ...commonData,
      description: `import { MathBlock } from '@blog/mdx-katex';测试内容<MathBlock>test</MathBlock>测试内容`,
      content: `
import { utils as c0 } from '@blog/mdx-katex';
import { utils as template } from '@blog/template-post';
import { defineUtils } from '@blog/context/runtime';
export const utils = defineUtils(template.getAssetNames().concat([
  c0.getAssetNames(),
]));

import { MathBlock } from '@blog/mdx-katex';

测试内容

<MathBlock>test</MathBlock>

测试内容
      `.trim(),
    });
  });

  it('with image', async () => {
    expect(await getPostData('测试内容\n\n![测试图片](../images/img.jpg)')).deep.eq({
      ...commonData,
      description: '测试内容![测试图片](../images/img.jpg)',
      content: `
import img0 from '../images/img.jpg';
import { utils as template } from '@blog/template-post';
import { defineUtils } from '@blog/context/runtime';
export const utils = defineUtils(template.getAssetNames());

测试内容

![测试图片](\`\${img0}\`)
      `.trim(),
    });
  });
});
