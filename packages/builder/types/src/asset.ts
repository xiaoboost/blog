/** 静态资源数据 */
export interface AssetData {
  path: string;
  content: Buffer;
}

/** 脚本资源引用及标签配置；文件内容通过普通 AssetData 输出 */
export interface ScriptAssetData {
  /** 脚本资源路径 */
  src: string;
  /** 脚本类型，默认 text/javascript */
  type?: 'text/javascript' | 'module';
  /** 文档解析完成后执行 */
  defer?: boolean;
  /** 下载完成后执行 */
  async?: boolean;
  /** 跨域请求方式 */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/** 样式资源引用及标签配置；文件内容通过普通 AssetData 输出 */
export interface StyleAssetData {
  /** 样式资源路径 */
  href: string;
  /** 应用样式的媒体条件，如 print 或 screen and (min-width: 768px) */
  media?: string;
  /** 跨域请求方式 */
  crossOrigin?: 'anonymous' | 'use-credentials';
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
