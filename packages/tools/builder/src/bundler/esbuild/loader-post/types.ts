import type { Root } from 'mdast';
import type React from 'react';

/** 文章原始元数据 */
export interface PostMeta {
  /** 文章标题 */
  title: string;
  /** 文章创建时间 */
  create: string;
  /** 文章原文 */
  content: string;
  /** 文章简介 */
  description?: string;
  /** 文章链接 */
  pathname?: string;
  /** 是否启用目录 */
  toc?: boolean;
  /** 是否可以被列表检索 */
  public?: boolean;
  /** 文章标签 */
  tags?: string[];
  /** 文章最后更新时间 */
  update?: string;
  /** 文章模板 */
  template?: string;
}

/** 文章元数据 */
export interface PostData {
  /** 文章标题 */
  title: string;
  /** 文章创建时间 */
  create: number;
  /** 文章最后更新时间 */
  update: number;
  /** 文章标签 */
  tags: string[];
  /** 是否可以被列表检索 */
  public: boolean;
  /** 文章原文 */
  content: string;
  /** 文章简介 */
  description: string;
  /** 网页链接 */
  pathname: string;
  /** 语法树数据 */
  ast: Root;
  /** 是否启用目录 */
  toc: boolean;
}

/** 文章元数据 */
export interface PostRendered extends Omit<PostData, 'content'> {
  /** 渲染函数 */
  Component: React.FC<Record<string, any>>;
}

export type {
  Root,
  Paragraph,
  Heading,
  ThematicBreak,
  Blockquote,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  HTML,
  Code,
  Text,
  Definition,
  FootnoteDefinition,
  Emphasis,
  Strong,
  Delete,
  InlineCode,
  Link,
  Image,
  LinkReference,
  ImageReference,
  Footnote,
  FootnoteReference,
  Resource,
  Association,
  Reference,
  Alternative,
  PhrasingContent,
  Content,
  RowContent,
} from 'mdast';

/** 解析器类型 */
export interface Parser {
  parse(code: string): Root;
  stringify(node: any): string;
}
