import type { AssetData } from './asset';

// ── 构建参数 ──

/** 字体桶 build() 参数 */
export interface IFontBucketBuildOptions {
  /** 格式化文件路径 */
  format(asset: AssetData): string;
  /**
   * 产出路径前缀
   *
   * @default '/'
   */
  scope?: string;
  /**
   * 文件名称
   *
   * @default 'font'
   */
  fileName?: string;
  /**
   * 是否启用子集化最小化
   *
   * @default true
   */
  minify?: boolean;
}

// ── 构造函数参数 ──

/** 字体源：文件路径 */
export interface IFontBucketPathSource {
  /** 字体文件完整路径 */
  fontSource: string;
  fontContent?: undefined;
}

/** 字体源：Buffer 内容 */
export interface IFontBucketBufferSource {
  fontSource?: undefined;
  /** 字体二进制内容 */
  fontContent: Buffer;
}

/** 字体桶构造函数参数 */
export type IFontBucketOptions = {
  /** 字体家族名（CSS font-family） */
  fontFamily?: string;
  /** CSS 类名（不传则由 fontFamily 推导） */
  className?: string;
  /** 回退字体 @default 'sans-serif' */
  fallbackFont?: string;
  /** 自定义字体文件加载器（仅 fontSource 模式生效） */
  getFontContent?(fontSource: string): Promise<Buffer>;
} & (IFontBucketPathSource | IFontBucketBufferSource);

// ── 字体桶接口 ──

/** 字体桶实例接口 */
export interface IFontBucket {
  readonly isBuilt: boolean;
  readonly isEmpty: boolean;

  /** 添加待子集化的文本 */
  addText(...texts: string[]): void;
  /** 获取 @font-face CSS 代码 */
  getFontFaceCss(): string;
  /** 获取 CSS 类名 */
  getClassName(): string;
  /** 获取子集化后的字体 AssetData */
  getFont(): AssetData;
  /** 构建字体 */
  build(buildOptions: IFontBucketBuildOptions): Promise<void>;
}

// ── 资源集聚合构建参数 ──

/** 聚合构建参数 */
export interface IBuildFontsOptions extends Omit<IFontBucketBuildOptions, 'minify'> {
  /**
   * 指定构建的字体家族
   *   - 不传则构建所有已注册的字体桶
   */
  families?: string[];
}
