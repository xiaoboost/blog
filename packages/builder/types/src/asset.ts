/** 静态资源数据 */
export interface AssetData {
  path: string;
  content: Buffer;
}

export type PreloadAs = 'font' | 'style' | 'script' | 'image' | 'fetch';

export interface PreloadAssetData {
  /** 资源路径 */
  href: string;
  /** 标签的 as 属性 */
  as: PreloadAs;
  /**
   * 标签的 type 属性
   *
   * @description 如 `font/woff2`、`text/css` 等
   */
  type?: string;
  /**
   * 标签的 crossOrigin 属性
   *
   * @description 如 `anonymous`、`use-credentials`
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /**
   * 标签的 media 属性
   *
   * @description 如 `screen and (min-width: 768px)`
   */
  media?: string;
}
