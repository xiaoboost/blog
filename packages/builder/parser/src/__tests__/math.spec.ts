import { expect, describe, it } from '@blog/test-toolkit';
import { visit } from '../ast/walk';
import { compile, parse, transformMath } from '../core/parser';
import { getPostData } from '../post/transformer';

async function getFormulas(content: string) {
  const transformed = await transformMath(content);
  const values: string[] = [];
  visit(await parse('test.mdx', transformed), (node) => {
    if (node.type === 'mdxTextExpression' || node.type === 'mdxFlowExpression') {
      values.push(JSON.parse(node.value));
    }
  });
  return { transformed, values };
}

describe('math', () => {
  it('保留 aligned 环境的花括号、反斜杠和换行', async () => {
    const formula = String.raw`\begin{aligned}
e(\gamma) &= (\delta, g) \\
g(\delta) &\simeq \gamma
\end{aligned}`;
    const input = `$$$\n${formula}\n$$$`;
    const { transformed, values } = await getFormulas(input);
    expect(values).deep.eq([formula]);
    expect(transformed).contain('MathBlock as BlogMathBlock');
    expect(await compile(input)).contain('<BlogMathBlock>');
  });

  it('支持行内公式和双美元符号块级公式', async () => {
    const { transformed, values } = await getFormulas('状态 $\\gamma$，执行 $e$。\n\n$$\nx^{2}\n$$');
    expect(values).deep.eq([
      '\\gamma', 'e', 'x^{2}',
    ]);
    expect(transformed.match(/from '@blog\/mdx-katex'/g)).length(1);
  });

  it('代码、转义美元符号、链接地址和 MDX 表达式保持原样', async () => {
    const content = [
      '`$x$`',
      '```js\nconst text = "$x$";\n```',
      '~~~text\n$$$\n\\begin{aligned}\n$$$\n~~~',
      String.raw`价格 \$5 和 \$10，单个 $ 符号。`,
      '[链接](https://example.com/$x$)',
      'export const text = "$x$";',
      '<Widget label="$x$" />',
      '{"$x$"}',
    ].join('\n\n');
    expect(await transformMath(content)).eq(content);
    expect(await compile(content)).not.contain('@blog/mdx-katex');
  });

  it('引用和列表中的公式保留容器结构', async () => {
    const input = '> $$$\n> x^{2}\n> $$$\n\n- 行内 $y$';
    const { values } = await getFormulas(input);
    expect(values).deep.eq(['x^{2}', 'y']);
    const code = await compile(input);
    expect(code).contain('_components.blockquote');
    expect(code).contain('_components.li');
  });

  it('公式中的引号和模板表达式作为字符串保留', async () => {
    const formula = 'x + "quoted" + `tick` + ${value}';
    expect((await getFormulas(`$$$\n${formula}\n$$$`)).values).deep.eq([formula]);
  });

  it('兼容手写组件导入，避开文章已有变量，并且不会重复转换', async () => {
    const input = "import { MathInline } from '@blog/mdx-katex';\n\nexport const BlogMathInline = 1;\n\n$x$ <MathInline>y</MathInline>";
    const transformed = await transformMath(input);
    expect(transformed).contain('MathInline as BlogMathInline_');
    expect(transformed).contain('<MathInline>y</MathInline>');
    expect(await transformMath(transformed)).eq(transformed);
    await compile(transformed);
  });

  it('只为含公式的文章收集 KaTeX 资源', async () => {
    const meta = '---\ntitle: 测试\ncreate: 2026/01/01\nupdate: 2026/01/01\n---\n\n';
    const math = await getPostData(`${meta}$x$`, 'test.md');
    expect(math.content).contain("import { utils as c0 } from '@blog/mdx-katex'");
    expect(math.content).contain('c0.getAssetNames()');
    expect(math.description).eq('$x$');
    const plain = await getPostData(`${meta}普通文章`, 'test.md');
    expect(plain.content).not.contain('@blog/mdx-katex');
  });
});
