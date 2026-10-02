import { mock } from 'node:test';
import { expect, describe, it } from '@blog/test-toolkit';
import type { Mdx } from '@blog/types';
import { getAttribute, getChildrenContent, visit } from '../ast/walk';
import { transform } from '../post';
import { compilePost, postSource } from './helpers';

describe('post compile pipeline', () => {
  it('文章正文只 parse 一次、run 一次', async () => {
    const { createProcessor } = await import('@mdx-js/mdx');
    const prototype = Object.getPrototypeOf(createProcessor());
    const parse = mock.method(prototype, 'parse');
    const run = mock.method(prototype, 'run');
    try {
      await transform(postSource('$x$\n\n```ts\nconst a = 1;\n```', 'lsp: true\n'), '/test/post.mdx');
      expect(parse.mock.callCount()).eq(1);
      expect(run.mock.callCount()).eq(1);
    }
    finally {
      parse.mock.restore();
      run.mock.restore();
    }
  });

  it('保持 default、utils、data 导出，以及配置和组件 props 的行为', async () => {
    const post = await compilePost('{props.post.description}', [
      'description: 中文简介',
      'pathname: custom/path',
      'public: false',
      'toc: false',
      'draft: true',
      'tags: [标签甲, 标签乙]',
      '',
    ].join('\n'));
    const { ast, ...data } = post.data;
    expect(data).deep.eq({
      title: '测试',
      create: Date.UTC(2026, 0, 1, 8),
      update: Date.UTC(2026, 0, 2, 8),
      tags: [{ name: '标签甲', url: '' }, { name: '标签乙', url: '' }],
      public: false,
      filePath: '/test/post.mdx',
      pathname: 'custom/path',
      toc: false,
      lsp: false,
      template: 'post',
      draft: true,
      description: '中文简介',
    });
    expect(ast.type).eq('root');
    expect(post.default({ post: data })).deep.eq({
      type: 'Fragment', props: { children: '中文简介' },
    });
    expect(post.utils.getAssetNames()).deep.eq(['@blog/template-post']);
  });

  it('按包收集手写组件 import、去重、保留顺序，并支持指定模板', async () => {
    const post = await compilePost([
      "import { MathInline } from '@blog/mdx-katex';",
      "import { MathBlock } from '@blog/mdx-katex';",
      "import * as Font from '@blog/mdx-font-block';",
      "import '@blog/mdx-typo';",
      "import { Other } from './other';",
      '',
      '<MathInline>x</MathInline>',
    ].join('\n'), 'template: custom\n');
    expect(post.utils.getAssetNames()).deep.eq([
      '@blog/template-custom', '@blog/mdx-katex', '@blog/mdx-font-block', '@blog/mdx-typo',
    ]);
    const utilsImports = post.code.match(/^import\s*\{\s*utils\s+as\s+/gm) ?? [];
    expect(utilsImports).length(4);
  });

  it('导出精简的 mdast，保留目录、字体和代码扫描所需的数据', async () => {
    const rawCode = 'import { value } from "example-package";\nconst text = `中文 ${value}`;';
    const source = [
      "import { FontBlock } from '@blog/mdx-font-block';",
      '',
      '# 中文 **标题**',
      '',
      '![图片](../images/image.jpg)',
      '',
      '<FontBlock src="../fonts/font.otf">字体内容</FontBlock>',
      '',
      `\`\`\`ts?lsp&visible=false\n${rawCode}\n\`\`\``,
      '',
      '$x$ 与 ~~删除线~~',
      '',
      '| 表头 |',
      '| --- |',
      '| 值 |',
    ].join('\n');
    const { data } = await compilePost(source);
    const nodes: Mdx.Nodes[] = [];
    visit(data.ast, (node) => nodes.push(node));
    const heading = nodes.find((node) => node.type === 'heading')!;
    expect(getChildrenContent(heading)).eq('中文 标题');
    expect(heading.depth).eq(1);
    const image = nodes.find((node) => node.type === 'image');
    expect(image?.url).eq('../images/image.jpg');
    const font = nodes.find((node) => node.type === 'mdxJsxFlowElement' && node.name === 'FontBlock');
    if (font?.type !== 'mdxJsxFlowElement') throw new Error('FontBlock 节点丢失');
    expect(getChildrenContent(font)).eq('字体内容');
    expect(getAttribute('src', font.attributes)?.value).eq('../fonts/font.otf');
    const block = nodes.find((node) => node.type === 'mdxJsxFlowElement' && node.name === 'TsCodeBlock');
    if (block?.type !== 'mdxJsxFlowElement') throw new Error('TS 代码节点丢失');
    const expression = block.children[0];
    if (expression.type !== 'mdxFlowExpression') throw new Error('代码表达式丢失');
    expect(JSON.parse(expression.value)).eq(rawCode + '\n');
    expect(nodes.some((node) => node.type === 'delete')).true;
    expect(nodes.some((node) => node.type === 'table')).true;
    const esm = nodes.filter((node) => node.type === 'mdxjsEsm').map((node) => node.value).join('\n');
    expect(esm).contain('export const utils');
    expect(esm).not.contain('export const data');
    expect(JSON.stringify(data.ast)).not.match(/"(?:position|data)":/);
    expect(JSON.stringify(data.ast)).not.contain('"type":"JSXElement"');
  });

  it('并行编译的 LSP、模板和资源配置互不影响', async () => {
    const source = '```ts\nconst a = 1;\n```';
    const [enabled, disabled] = await Promise.all([
      compilePost(source, 'lsp: true\ntemplate: first\n'),
      compilePost(source, 'lsp: false\ntemplate: second\n'),
    ]);
    expect(enabled.utils.getAssetNames()).deep.eq(['@blog/template-first', '@blog/mdx-code-block-typescript']);
    expect(disabled.utils.getAssetNames()).deep.eq(['@blog/template-second']);
    expect(enabled.data.lsp).true;
    expect(disabled.data.lsp).false;
    expect(disabled.code).contain('_components.pre');
  });

  it('格式化不会改变导出数据、资源与渲染结果', async () => {
    const content = '# 标题\n\n"引号"、反斜杠 \\ 与 $x$\n\n![图](./image.png)';
    const plain = await compilePost(content);
    const formatted = await compilePost(content, '', true);
    expect(formatted.data).deep.eq(plain.data);
    expect(formatted.utils.getAssetNames()).deep.eq(plain.utils.getAssetNames());
    expect(formatted.default()).deep.eq(plain.default());
  });

  it('语法错误仍携带原文件和正文位置，不受生成的 import 影响', async () => {
    const content = '# 标题\n\n{1 + }';
    try {
      await transform(postSource(content), '/test/broken.mdx');
      expect.fail('应当报告错误的表达式');
    }
    catch (error: any) {
      expect(error.project).eq('UNKNOWN');
      expect(error.filePath).eq('/test/broken.mdx');
      expect(error.codeFrame.content).eq(content);
      expect(error.codeFrame.range.start.line).eq(3);
    }
  });
});
