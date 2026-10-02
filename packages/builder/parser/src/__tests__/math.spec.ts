import { expect, describe, it } from '@blog/test-toolkit';
import { visit } from '../ast/walk';
import { compile } from '../core/parser';
import { remarkMathComponents } from '../plugins/math';
import { compilePost } from './helpers';

async function getFormulas(content: string) {
  const { data: { ast } } = await compilePost(content);
  const values: string[] = [];
  visit(ast, (node) => {
    if (node.type === 'mdxTextExpression' || node.type === 'mdxFlowExpression') {
      values.push(JSON.parse(node.value));
    }
  });
  const imports = ast.children.filter((node) => node.type === 'mdxjsEsm').map((node) => node.value);
  return { ast, imports: imports.join('\n'), values };
}

describe('math', () => {
  it('保留 aligned 环境的花括号、反斜杠和换行', async () => {
    const formula = String.raw`\begin{aligned}
e(\gamma) &= (\delta, g) \\
g(\delta) &\simeq \gamma
\end{aligned}`;
    const input = `$$$\n${formula}\n$$$`;
    const { imports, values } = await getFormulas(input);
    expect(values).deep.eq([formula]);
    expect(imports).contain('import { MathBlock } from "@blog/mdx-katex";');
    expect(await compile(input)).contain('<MathBlock>');
  });

  it('支持行内公式和双美元符号块级公式', async () => {
    const { imports, values } = await getFormulas('状态 $\\gamma$，执行 $e$。\n\n$$\nx^{2}\n$$');
    expect(values).deep.eq([
      '\\gamma', 'e', 'x^{2}',
    ]);
    // 组件导入和资源 utils 导入各一条。
    expect(imports.match(/@blog\/mdx-katex/g)).length(2);
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
    expect((await getFormulas(content)).imports).not.contain('@blog/mdx-katex');
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

  it('同类公式共用组件导入，并且不会重复转换', async () => {
    const input = '$x$ 与 $y$\n\n$$\nz\n$$';
    const { ast, imports } = await getFormulas(input);
    expect(imports).contain('import { MathInline, MathBlock } from "@blog/mdx-katex";');
    const { unified } = await import('unified');
    const before = JSON.stringify(ast);
    await unified().use(remarkMathComponents).run(ast);
    expect(JSON.stringify(ast)).eq(before);
    expect(await compile(input)).contain('<MathInline>');
  });

  it('只为含公式的文章收集 KaTeX 资源', async () => {
    const math = await compilePost('$x$');
    expect(math.utils.getAssetNames()).deep.eq(['@blog/template-post', '@blog/mdx-katex']);
    expect(math.data.description).eq('$x$');
    const plain = await compilePost('普通文章');
    expect(plain.utils.getAssetNames()).deep.eq(['@blog/template-post']);
  });
});
