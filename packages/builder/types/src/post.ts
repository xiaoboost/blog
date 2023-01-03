import { Root } from 'mdast';
import { FC } from 'react';

import type * as Mdx from 'mdast';
import type * as EsTree from 'estree';

import { TemplateUtils } from './template';

export type { Mdx, EsTree };

/** 文章原始数据 */
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

/** 文章基础属性 */
export interface PostBasicData {
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
  /** 文章简介 */
  description: string;
  /** 网页链接 */
  pathname: string;
  /** 语法树数据 */
  ast: Root;
  /** 是否启用目录 */
  toc: boolean;
  /** 文章模板 */
  template: string;
}

/** 文章属性 */
export interface PostData extends PostBasicData {
  /** 文章原文 */
  content: string;
}

/** 文章导出数据 */
export interface PostExportData {
  /** 文章数据 */
  data: PostBasicData;
  /** 文章工具方法 */
  utils: TemplateUtils;
}

/** 包含渲染函数的文章导出数据 */
export interface PostExportDataWithComponent extends PostExportData {
  /** 渲染函数 */
  Component: FC<Record<string, any>>;
}

/** 列表导出的文章数据 */
export type PostsExportType = PostExportDataWithComponent[];

/** 解析器类型 */
export interface Parser {
  parse(code: string): Root;
  stringify(node: any): string;
}
