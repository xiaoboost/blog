import type * as EsTree from 'estree';
import type * as Mdx from 'mdast';

export { Mdx, EsTree };

declare module 'mdast' {
  export interface JsxAttribute {
    type: 'mdxJsxAttribute';
    name: string;
    value: string;
  }

  export interface JsxFlowElement {
    type: 'mdxJsxFlowElement';
    children: Syntax[];
    attributes: JsxAttribute[];
    name: string;
  }

  export interface JsEsm {
    type: 'mdxjsEsm';
    value: string;
    data: {
      estree: EsTree.Program;
    };
  }

  interface Root {
    children: Syntax[];
  }

  export type Syntax =
    | JsxAttribute
    | JsxFlowElement
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
    | HTML
    | Code
    | YAML
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
    | Footnote
    | FootnoteReference;
}
