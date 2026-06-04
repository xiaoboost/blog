import { expect, describe, it } from '@blog/test-toolkit';
import { parse } from '../parser';
import { getChildrenContent } from '../walk';

describe('getChildrenContent', () => {
  it('纯文本', async () => {
    const ast = await parse('test.md', 'hello world');
    expect(getChildrenContent(ast)).eq('hello world');
  });

  it('带内联格式的文本', async () => {
    const ast = await parse('test.md', 'hello **bold** world');
    expect(getChildrenContent(ast)).eq('hello bold world');
  });

  it('带 MDX 表达式的文本', async () => {
    const ast = await parse('test.mdx', 'hello {name}');
    expect(getChildrenContent(ast)).eq('hello ');
  });
});
