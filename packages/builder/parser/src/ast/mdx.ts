import type { EsTree, Mdx } from '@blog/types';

export function createEsm(value: string, body: EsTree.Program['body']): Mdx.MdxjsEsm {
  return {
    type: 'mdxjsEsm',
    value,
    data: { estree: { type: 'Program', sourceType: 'module', body } },
  };
}

export function createExport(name: string, value: EsTree.Expression, code: string): Mdx.MdxjsEsm {
  return createEsm(`export const ${name} = ${code};`, [
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'VariableDeclaration', kind: 'const',
        declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name }, init: value }],
      },
      specifiers: [],
      source: null,
    },
  ]);
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** 将已序列化的文章数据写成对象表达式，无需再次解析生成的源码。 */
export function createJsonExpression(value: JsonValue): EsTree.Expression {
  if (Array.isArray(value)) {
    return { type: 'ArrayExpression', elements: value.map(createJsonExpression) };
  }
  if (value !== null && typeof value === 'object') {
    return {
      type: 'ObjectExpression',
      properties: Object.entries(value).map(([key, item]) => ({
        type: 'Property', kind: 'init', method: false, shorthand: false, computed: false,
        key: { type: 'Literal', value: key }, value: createJsonExpression(item),
      })),
    };
  }
  return { type: 'Literal', value };
}

/** MDX 编译器通过 ESTree 读取表达式的值。 */
export function createExpression(value: string | boolean | null): Mdx.MdxFlowExpression {
  return {
    type: 'mdxFlowExpression',
    value: JSON.stringify(value),
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: { type: 'Literal', value },
          },
        ],
      },
    },
  };
}

/** 同时提供 import 文本和 AST，供资源收集及 MDX 编译使用。 */
export function createImport(
  source: string, names: Map<string, string> | Set<string>,
): Mdx.MdxjsEsm {
  const entries = Array.from(names.entries());
  const specifiers = entries.map(([name, local]) => name === local ? name : `${name} as ${local}`);
  return {
    type: 'mdxjsEsm',
    value: `import { ${specifiers.join(', ')} } from ${JSON.stringify(source)};`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            source: { type: 'Literal', value: source },
            specifiers: entries.map(([name, local]) => ({
              type: 'ImportSpecifier',
              imported: { type: 'Identifier', name },
              local: { type: 'Identifier', name: local },
            })),
          },
        ],
      },
    },
  };
}
