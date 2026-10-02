import { expect, describe, it } from '@blog/test-toolkit';
import { visit } from '../ast/walk';
import { compile, parse } from '../core/parser';
import { getPostData } from '../post';
import { compilePost, postSource } from './helpers';

describe('parser stages', () => {
  it('内置插件接收完整的文章配置，保留其中的 filePath', async () => {
    const meta = 'lsp: true\ntemplate: custom\n';
    const { content, ...data } = await getPostData(
      postSource('$x$', meta), '/test/post.mdx',
    );
    const post = await compilePost(content, meta);
    const { ast, ...exportedData } = post.data;
    expect(exportedData).deep.eq(data);
    expect(ast.type).eq('root');
    expect(post.code).contain('@blog/template-custom');
    expect(post.code).contain('export const utils');
    expect(post.code).contain('export const data');
  });

  it('普通 MDX 编译仍执行组件插件，不生成文章专属导出', async () => {
    const code = await compile('$x$\n\n```ts\nconst a = 1;\n```', false, { lsp: true });
    expect(code).contain('<MathInline>');
    expect(code).contain('<TsCodeBlock');
    expect(code).not.contain('@blog/template-');
    expect(code).not.contain('export const utils');
    expect(code).not.contain('export const data');
  });

  it('parse 只返回原始语法树，不转换组件或注入 import', async () => {
    const source = '$x$\n\n```ts\nconst a = 1;\n```\n\n| 标题 |\n| --- |\n| 值 |';
    const ast = await parse('/test/post.mdx', source, { lsp: true });
    const types: string[] = [];
    visit(ast, (node) => types.push(node.type));
    expect(types).include.members([
      'inlineMath', 'code', 'table',
    ]);
    expect(types).not.include('mdxjsEsm');
    expect(types).not.include('mdxJsxFlowElement');
  });

  it('编译错误使用文章配置中的 filePath', async () => {
    const content = '# 标题\n\n{1 + }';
    try {
      await compile(content, false, { filePath: '/test/broken.mdx' });
      expect.fail('应当报告错误的表达式');
    }
    catch (error: any) {
      expect(error.filePath).eq('/test/broken.mdx');
      expect(error.codeFrame.content).eq(content);
      expect(error.codeFrame.range.start.line).eq(3);
    }
  });
});
