import { expect, describe, it } from '@blog/test-toolkit';
import type { Mdx } from '@blog/types';
import { visit } from '../ast/walk';
import { compile } from '../core/parser';
import { remarkTsCodeBlock } from '../plugins/code-block';
import { compilePost } from './helpers';

const fence = (info: string, code = 'const value = 1;') => `\`\`\`${info}\n${code}\n\`\`\``;

function components(ast: Mdx.Root) {
  const result: Mdx.MdxJsxFlowElement[] = [];
  visit(ast, (node) => {
    if (node.type === 'mdxJsxFlowElement' && node.name === 'TsCodeBlock') result.push(node);
  });
  return result;
}

function props(node: Mdx.MdxJsxFlowElement) {
  return Object.fromEntries(node.attributes.map((attr) => {
    if (attr.type !== 'mdxJsxAttribute' || !attr.value || typeof attr.value === 'string') {
      throw new Error('预期插件生成表达式属性');
    }
    return [attr.name, JSON.parse(attr.value.value)];
  }));
}

describe('remark TS code block', () => {
  for (const lang of [
    'ts', 'typescript', 'tsx', 'js', 'javascript', 'jsx',
  ]) {
    it(`${lang}: 围栏配置覆盖文章配置，默认不开启 LSP`, async () => {
      for (const [
        info, lsp, enabled,
      ] of [
          [
            lang, false, false,
          ], [
            lang, true, true,
          ],
          [
            `${lang}?lsp=false`, true, false,
          ], [
            `${lang}?lsp=true`, false, true,
          ],
          [
            `${lang}?lsp`, false, true,
          ],
        ] as const) {
        const content = fence(info);
        const { data: { ast }, code } = await compilePost(content, `lsp: ${lsp}\n`);
        expect(components(ast).length).eq(enabled ? 1 : 0);
        expect(code.includes('<TsCodeBlock')).eq(enabled);
      }
    });
  }

  it('缺少语言或不支持的语言保持普通围栏', async () => {
    for (const lang of ['', 'json?lsp=true']) {
      const content = fence(lang);
      const { data: { ast } } = await compilePost(content, 'lsp: true\n');
      const body = ast.children.filter((node) => node.type !== 'mdxjsEsm');
      expect(body.map((node) => node.type)).deep.eq(['code']);
      expect(await compile(content, false, { lsp: true })).not.contain('@blog/mdx-code-block-typescript');
    }
  });

  it('插件确定语言、默认值和隐藏定义的参数', async () => {
    const defaults = components((await compilePost(fence('typescript?lsp'))).data.ast)[0];
    expect(props(defaults)).deep.eq({ lang: 'ts', platform: 'none', showError: true, visible: true });
    const content = fence('javascript?lsp&platform=browser&showError=false&visible=false&exportAs=@@local/helper');
    const hidden = components((await compilePost(content)).data.ast)[0];
    expect(props(hidden)).deep.eq({
      lang: 'js', platform: 'browser', showError: false, visible: false, exportAs: '@@local/helper',
    });
    expect(await compile(content)).contain('visible={false}');
    expect(await compile(fence('json?visible=false'))).not.contain('_components.pre');
  });

  it('代码中的换行、引号、反斜杠、模板插值和公式符号保持原值', async () => {
    const code = [
      'import { debounce } from "lodash";',
      String.raw`const path = "C:\temp";`,
      'const text = `value: ${value}`;',
      '// 中文 <Tag> & {braces} $x$',
    ].join('\n');
    const post = await compilePost(fence('ts?lsp', code));
    const block = components(post.data.ast)[0];
    const child = block.children[0] as Mdx.MdxFlowExpression;
    expect(JSON.parse(child.value)).eq(code + '\n');
    expect(post.default()).deep.eq({
      type: '@blog/mdx-code-block-typescript.TsCodeBlock',
      props: { ...props(block), children: code + '\n' },
    });
    expect(await compile(fence('ts?lsp', code))).not.contain('@blog/mdx-katex');
  });

  it('嵌套围栏仍在原容器内，多次运行不会重复生成 import', async () => {
    const content = '> ```ts?lsp\n> const a = 1;\n> ```\n\n- ```tsx?lsp\n  const b = <div />;\n  ```';
    const { data: { ast } } = await compilePost(content);
    expect(components(ast)).length(2);
    const body = ast.children.filter((node) => node.type !== 'mdxjsEsm');
    expect(body.map((node) => node.type)).deep.eq(['blockquote', 'list']);
    const { unified } = await import('unified');
    const before = JSON.stringify(ast);
    await unified().use(remarkTsCodeBlock).run(ast);
    expect(JSON.stringify(ast)).eq(before);
    const code = await compile(content);
    expect(code).contain('_components.blockquote');
    expect(code).contain('_components.li');
    expect(code.match(/from "@blog\/mdx-code-block-typescript"/g)).length(1);
  });

  it('文章编译传递 LSP 配置，资源收集识别插件生成的 import', async () => {
    const content = `$x$\n\n${fence('ts')}\n\n${fence('ts?lsp=false')}`;
    const post = await compilePost(content, 'lsp: true\n');
    expect(post.utils.getAssetNames()).deep.eq([
      '@blog/template-post', '@blog/mdx-code-block-typescript', '@blog/mdx-katex',
    ]);
    expect(components(post.data.ast)).length(1);
    expect(post.code).contain('<MathInline>');
    expect(post.code).contain('<TsCodeBlock');
    expect(post.code).contain('_components.pre');
    const plain = await compilePost(fence('ts?lsp=false'), 'lsp: true\n');
    expect(plain.utils.getAssetNames()).deep.eq(['@blog/template-post']);
  });
});
