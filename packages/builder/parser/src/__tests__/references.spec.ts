import { rejects } from 'node:assert/strict';
import { expect, describe, it } from '@blog/test-toolkit';
import { compile } from '../core/parser';

describe('inline references', () => {
  it('只声明一次资料，生成编号、文末列表和返回链接', async () => {
    const code = await compile('正文。<Ref title="资料甲" href="https://example.com/source" note="第 4 章" />');
    expect(code).contain('data-footnote-ref');
    expect(code).contain('data-footnote-backref');
    expect(code).contain('data-footnotes');
    expect(code).contain('引用与参考资料');
    expect(code).contain('id="footnote-label"');
    expect(code).contain('https://example.com/source');
    expect(code).contain('第 4 章');
    expect(code.match(/资料甲/g)).length(1);
    expect(code).not.contain('_components.Ref');
  });

  it('重复 id 复用同一编号，并保留两个正文返回位置', async () => {
    const code = await compile('第一次。<Ref id="book" title="资料甲" />\n\n第二次。<Ref id="book" />');
    expect(code.match(/id="user-content-fn-blog-ref-1"/g)).length(1);
    expect(code.match(/href="#user-content-fn-blog-ref-1"/g)).length(2);
    expect(code).contain('id="user-content-fnref-blog-ref-1-2"');
    expect(code).contain('href="#user-content-fnref-blog-ref-1-2"');
  });

  it('可向后引用，同一资料的重复完整声明也合并', async () => {
    const code = await compile([
      '先引用。<Ref id="book" />',
      '后声明。<Ref id="book" title="资料甲" />',
      '另一份。<Ref title="资料乙" href="https://example.com/b" />',
      '再一次。<Ref title="资料乙" href="https://example.com/b" />',
    ].join('\n\n'));
    expect(code.match(/资料甲/g)).length(1);
    expect(code.match(/资料乙/g)).length(1);
    expect(code.match(/data-footnote-ref/g)).length(4);
  });

  it('与原生 Markdown 脚注共存，避开已有标识符', async () => {
    const code = await compile('普通脚注[^blog-ref-1]。<Ref title="资料甲" />\n\n[^blog-ref-1]: 原有注释');
    expect(code).contain('id="user-content-fn-blog-ref-1"');
    expect(code).contain('id="user-content-fn-blog-ref-1-"');
    expect(code).contain('原有注释');
  });

  it('代码示例不参与收集，不同文章之间不共享资料或编号', async () => {
    const example = await compile('```mdx\n<Ref title="示例" />\n```');
    expect(example).not.contain('data-footnotes');
    await compile('正文。<Ref title="甲" /><Ref title="乙" />');
    const next = await compile('正文。<Ref title="丙" />');
    expect(next).contain('id="user-content-fn-blog-ref-1"');
    expect(next).not.contain('blog-ref-2');
  });

  it('独立成行的 Ref 也能正常编译', async () => {
    const code = await compile('<Ref title="资料甲" />');
    expect(code).contain('<_components.p><_components.sup>');
  });

  it('漏写定义、id 冲突或动态属性时明确报错', async () => {
    await rejects(compile('正文。<Ref id="missing" />'), /没有完整的资料声明/);
    await rejects(compile('正文。<Ref id="a" title="甲" /><Ref id="a" title="乙" />'), /不同的资料/);
    await rejects(compile('正文。<Ref title={"甲"} />'), /静态字符串/);
    await rejects(compile('正文。<Ref />'), /需要 title/);
  });
});
