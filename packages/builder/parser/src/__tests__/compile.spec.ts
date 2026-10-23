import { expect, describe, it } from '@blog/test-toolkit';
import { compilePost } from './helpers';

describe('compile', () => {
  it('自定义组件内部的 Markdown 正确编译并传给组件', async () => {
    const post = await compilePost(`
import { TestBlock } from '@blog/components/test-block';

<TestBlock>

正文 **粗体**

</TestBlock>
`);
    expect(post.default()).deep.eq({
      type: '@blog/components/test-block.TestBlock',
      props: {
        children: {
          type: 'p',
          props: { children: ['正文 ', { type: 'strong', props: { children: '粗体' } }] },
        },
      },
    });
  });
});
