import type * as EsTree from 'estree';
import type * as Mdx from 'mdast';

export { Mdx, EsTree };

declare module 'mdast' {
  export interface JsxAttribute {
    type: 'mdxJsxAttribute';
    name: string;
    value: mdxJsxAttributeValueExpression;
  }

  /** 块级自定义组件元素 */
  export interface JsxFlowElement {
    type: 'mdxJsxFlowElement';
    children: Syntax[];
    attributes: JsxAttribute[];
    name: string;
  }

  /** 行内自定义组件元素 */
  export interface JsxTextElement extends Omit<JsxFlowElement, 'type'> {
    type: 'mdxJsxTextElement';
  }

  export interface JsEsm {
    type: 'mdxjsEsm';
    value: string;
    data: {
      estree: EsTree.Program;
    };
  }

  export interface mdxJsxAttributeValueExpression extends Omit<JsEsm, 'type'> {
    type: 'mdxJsxAttributeValueExpression';
  }

  interface Root {
    children: Syntax[];
  }

  export type Syntax =
    | JsxAttribute
    | JsxFlowElement
    | JsxTextElement
    | JsEsm
    | Root
    | Paragraph
    | Heading
    | ThematicBreak
    | Blockquote
    | List
    | ListItem
    | Table
    | TableRow
    | TableCell
    | Html
    | Code
    | Yaml
    | Definition
    | FootnoteDefinition
    | Text
    | Emphasis
    | Strong
    | Delete
    | InlineCode
    | Break
    | Link
    | Image
    | LinkReference
    | ImageReference
    | FootnoteReference;
}
