import { expect, describe, it } from '@blog/test-toolkit';
import { visit } from '../ast/walk';
import { compile, parse } from '../core/parser';

async function emphasisTypes(content: string) {
  const types: string[] = [];
  visit(await parse('test.mdx', content), (node) => {
    if (node.type === 'emphasis' || node.type === 'strong') {
      types.push(node.type);
    }
  });
  return types;
}

describe('CJK emphasis', () => {
  it('中文括号和标点紧邻正文时支持单、双、三星号', async () => {
    const cases: [string, string[]][] = [
      ['*', ['emphasis']],
      ['**', ['strong']],
      ['***', ['emphasis', 'strong']],
    ];
    for (const [marker, types] of cases) {
      for (const term of [
        '副作用迭代器（effect iterator）', '（插件）', '结论。',
      ]) {
        const content = `论文用${marker}${term}${marker}表示`;
        expect(await emphasisTypes(content)).deep.eq(types);
        const code = await compile(content);
        if (types.includes('emphasis')) {
          expect(code).contain('<_components.em>');
        }
        if (types.includes('strong')) {
          expect(code).contain('<_components.strong>');
        }
      }
    }
  });

  it('保留普通英文、中文和嵌套强调', async () => {
    expect(await emphasisTypes('中文*强调*正文，*English words* and **strong**'))
      .deep.eq([
        'emphasis', 'emphasis', 'strong',
      ]);
    expect(await emphasisTypes('前文*外层 **内层** 文字*后文'))
      .deep.eq(['emphasis', 'strong']);
    for (const content of [
      'foo_bar_baz', '* leading*', '*trailing *',
    ]) {
      expect(await emphasisTypes(content)).deep.eq([]);
    }
  });

  it('不将代码、转义、链接地址或 MDX 属性中的星号识别为强调', async () => {
    const content = [
      '`*术语（term）*正文`',
      '```text\n**结论。**正文\n```',
      String.raw`前文\*术语（term）\*正文`,
      '[链接](https://example.com/*term*)',
      '<Widget label="*术语（term）*正文" />',
      '{"*术语（term）*正文"}',
    ].join('\n\n');
    expect(await emphasisTypes(content)).deep.eq([]);
    const code = await compile(content);
    expect(code).not.contain('<_components.em>');
    expect(code).not.contain('<_components.strong>');
  });

  it('与 GFM 删除线、表格及公式编译共存', async () => {
    const code = await compile('~~删除~~，前文*术语（term）*后文 $x$\n\n| 标题 |\n| --- |\n| *术语（term）*正文 |');
    for (const tag of [
      'del', 'em', 'table',
    ]) {
      expect(code).contain(`<_components.${tag}>`);
    }
    expect(code).contain('<BlogMathInline>');
  });
});
