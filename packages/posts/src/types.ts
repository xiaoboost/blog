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
  /** 渲染后的网页源码 */
  html: string;
  /** 网页链接 */
  pathname: string;
  /** 是否启用目录 */
  toc: boolean;
  /** 样式文件列表 */
  styles: string[];
  /** 脚本文件列表 */
  scripts: string[];
}
