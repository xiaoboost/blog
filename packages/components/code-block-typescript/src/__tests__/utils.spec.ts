import { expect, describe, it } from '@blog/test-toolkit';
import type { Mdx, PostExportData } from '@blog/types';
import { getImportedByPost, getTsCodeBlockCode } from '../utils';

function block(code: string): Mdx.MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement', name: 'TsCodeBlock', attributes: [],
    children: [{ type: 'mdxFlowExpression', value: JSON.stringify(code) }],
  };
}

function post(children: Mdx.RootContent[]): PostExportData {
  return { data: { ast: { type: 'root', children } } } as PostExportData;
}

describe('TS code block source', () => {
  it('还原 parser 生成的字符串，保留引号、反斜杠、模板插值和换行', () => {
    const source = [
      'import { value } from "example-package";',
      String.raw`const path = "C:\temp";`,
      'const text = `中文 ${value}`;',
      '',
    ].join('\n');
    expect(getTsCodeBlockCode(block(source))).eq(source);
    expect(getImportedByPost([post([block(source)])]).has('example-package')).true;
  });

  it('保留手写组件表达式的源码扫描，不执行表达式', () => {
    const node = block('');
    const source = '`import { value } from "example-package";`';
    node.children = [{ type: 'mdxFlowExpression', value: source }];
    expect(getTsCodeBlockCode(node)).eq(source);
    expect(getImportedByPost([post([node])]).has('example-package')).true;
  });

  it('跳过缺少代码和非字符串值的组件', () => {
    const node = block('');
    node.children = [];
    expect(getTsCodeBlockCode(node)).undefined;
    node.children = [{ type: 'mdxFlowExpression', value: '42' }];
    expect(getTsCodeBlockCode(node)).undefined;
  });
});

describe('LSP dependency scanning', () => {
  it('普通代码围栏由 parser 决定是否转换，组件扫描不再重复判断配置', () => {
    const code: Mdx.Code = { type: 'code', lang: 'ts', value: 'import "example-package";' };
    expect([...getImportedByPost([post([code])])]).deep.eq([]);
  });

  it('扫描嵌套和隐藏的 TS 组件', () => {
    const hidden = block('import { value } from "example-package";');
    hidden.attributes = [
      {
        type: 'mdxJsxAttribute', name: 'visible',
        value: { type: 'mdxJsxAttributeValueExpression', value: 'false' },
      },
    ];
    const nested: Mdx.Blockquote = { type: 'blockquote', children: [hidden] };
    const result = getImportedByPost([post([nested])]);
    expect(result.has('example-package')).true;
    expect(result.has('@types/react')).true;
  });

  it('保持依赖去重和本地模块过滤', () => {
    const source = [
      'import "example-package";',
      'import "example-package";',
      'import "./local";',
      'import "fs";',
      'import "@blog/node";',
      'import "@@local/helper";',
    ].join('\n');
    const result = [...getImportedByPost([post([block(source), block(source)])])];
    expect(result.filter((name) => !name.startsWith('@types/'))).deep.eq(['example-package']);
  });
});
