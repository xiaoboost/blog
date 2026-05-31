import type { AssetData } from './asset';

// ── 构建参数 ──

/** 字体桶构建阶段的参数 */
export interface IFontBucketBuildOptions {
  /** CSS 文件产出路径 */
  cssFile?: string;
  /**
   * 字体文件产出路径模板
   *
   * 必须包含占位符 `{family}`，构建时会被替换为对应字体桶的 family 名，
   * 然后经 {@link rename} 做内容寻址得到最终路径。
   *
   * @example `/posts/slug/fonts/{family}.woff2`
   * @default '/fonts/font.woff2'
   */
  fontFile?: string;
  /** 公共 URL 路径前缀，用于生成 CSS 中的字体 URL @default '/' */
  publicPath?: string;
  /** 是否启用子集化最小化（默认开启，关闭用于调试） */
  minify?: boolean;
  /** 文件重命名 */
  rename?(asset: AssetData): string;
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
export type IFontBucketOptions = IFontBucketBuildOptions & {
  /** 字体家族名 @default 由 fontFile 文件名推导 */
  fontFamily?: string;
  /** CSS 类名 @default 由 fontFamily 推导 */
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
  /** 构建字体（子集化 + 生成 CSS） */
  build(buildOptions?: IFontBucketBuildOptions): Promise<void>;
}

// ── 资源集聚合构建参数 ──

/** 聚合构建参数 */
export interface IBuildFontsOptions extends IFontBucketBuildOptions {
  /** CSS 文件产出路径 */
  cssFile: string;
  /**
   * 指定构建的字体家族
   *   - 不传则构建所有已注册的字体桶
   */
  families?: string[];
}
