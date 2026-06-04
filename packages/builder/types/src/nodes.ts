import type * as EsTree from 'estree';
import type * as Mdx from 'mdast';

export { Mdx, EsTree };

/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module 'mdast' {
  export type MdxJsxAttributeValueExpression = import('mdast-util-mdx-jsx').MdxJsxAttributeValueExpression;
  export type MdxJsxExpressionAttribute = import('mdast-util-mdx-jsx').MdxJsxExpressionAttribute;
  export type MdxJsxAttribute = import('mdast-util-mdx-jsx').MdxJsxAttribute;
  export type MdxJsxFlowElement = import('mdast-util-mdx-jsx').MdxJsxFlowElement;
  export type MdxJsxTextElement = import('mdast-util-mdx-jsx').MdxJsxTextElement;
  export type MdxjsEsm = import('mdast-util-mdxjs-esm').MdxjsEsm;
  export type MdxFlowExpression = import('mdast-util-mdx-expression').MdxFlowExpression;
  export type MdxTextExpression = import('mdast-util-mdx-expression').MdxTextExpression;
}
