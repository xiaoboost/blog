export interface BookCache {
  /** 书籍网址 */
  url: string;
  /** 书籍标题 */
  title: string;
  /** 书籍简介 */
  intro: string;
  /** 书籍作者名称 */
  authorName: string;
  /** 书籍作者链接 */
  authorUrl: string;
  /** 书籍封面引用链接 */
  coverUrl: string;
}

export interface BookData extends BookCache {
  /** 书籍封面 */
  cover: Buffer;
}
