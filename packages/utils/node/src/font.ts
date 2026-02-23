import { Buffer } from 'buffer';
import { parse } from 'path';
import fs from 'fs/promises';
import subsetFont from 'subset-font';
import type { AssetData } from '@blog/types';
import { normalize } from './path';
import { toPinyin } from './string';

export interface FontBucketBuildOptions {
  /**
   * 公共 URL 路径
   * @description 用于生成 CSS 中的字体 URL
   * @default '/'
   */
  publicPath?: string;
  /**
   * 最小化
   */
  minify?: boolean;
  /**
   * 重命名方法
   */
  rename?(asset: AssetData): string;
}

interface FontBucketBaseOptions extends FontBucketBuildOptions {
  /**
   * CSS 文件路径
   *
   * @default '/styles/font.css'
   */
  cssFile?: string;
  /**
   * 字体文件路径
   *
   * @default '/fonts/font.woff2'
   */
  fontFile?: string;
  /**
   * 字体名称
   *
   * @default 'font.[hash:16]'
   */
  fontFamily?: string;
  /**
   * 样式类名
   * @description 用于生成 CSS 中的样式类名
   */
  className?: string;
  /**
   * 样式回退字体
   */
  fallbackFont?: string;
  /**
   * 重命名方法
   */
  rename?(asset: AssetData): string;
  /**
   * 获取字体文件内容
   */
  getFontContent?(fontSource: string): Promise<Buffer>;
}

interface FontBucketPathSourceOptions {
  /**
   * 原始文件路径
   * @description 必须是字体文件的完整路径
   */
  fontSource: string;
  /**
   * 字体二进制内容
   * @description 当提供 fontSource 时，不应再直接提供字体内容
   */
  fontContent?: undefined;
}

interface FontBucketBufferSourceOptions {
  /**
   * 原始文件路径
   * @description 当直接提供字体内容时不需要
   */
  fontSource?: undefined;
  /**
   * 字体二进制内容
   * @description 与 fontSource 二选一，必须至少提供一个
   */
  fontContent: Buffer;
}

export type FontBucketOptions = FontBucketBaseOptions &
  (FontBucketPathSourceOptions | FontBucketBufferSourceOptions);

export class FontBucket {
  private options: FontBucketOptions;

  private chars = new Set<string>();

  private cssCode: string | null = null;

  private minFont: Buffer | null = null;

  /** 解析出的字体名称 */
  private resolvedFontName: string | null = null;

  /** 解析出的字体地址 */
  private resolvedFontPath: string | null = null;

  /** 解析出的样式地址 */
  private resolvedCssPath: string | null = null;

  constructor(options: FontBucketOptions) {
    this.options = { ...options };
    this.resolvedFontPath = normalize(
      this.options.publicPath ?? '/',
      this.options.fontFile ?? '/fonts/font.woff2',
    );
    this.resolvedCssPath = normalize(
      this.options.publicPath ?? '/',
      this.options.cssFile ?? '/styles/font.css',
    );
  }

  /** 字体文件 URL 路径 */
  private getFontPath(): string {
    if (!this.resolvedFontPath) {
      throw new Error('字体文件路径未解析，请先运行 build 方法');
    }

    return normalize(this.options.publicPath ?? '/', this.resolvedFontPath);
  }

  /** 样式文件 URL 路径 */
  private getCssPath(): string {
    if (!this.resolvedCssPath) {
      throw new Error('样式文件路径未解析，请先运行 build 方法');
    }

    return normalize(this.options.publicPath ?? '/', this.resolvedCssPath);
  }

  /** 解析出的字体文件名 */
  private getFontFamily() {
    return this.resolvedFontName ?? (this.options.fontFamily ?? 'font').replace(/"/g, '');
  }

  get isBuilt() {
    return this.minFont !== null && this.cssCode !== null;
  }

  get isEmpty() {
    return this.chars.size === 0;
  }

  /**
   * 字体子集化
   */
  private async subsetFont(font: Buffer): Promise<Buffer> {
    const text = Array.from(this.chars).join('') || ' ';
    return subsetFont(font, text, {
      targetFormat: 'woff2',
      noLayoutClosure: true,
    });
  }

  getClassName(): string {
    return (this.options.className ?? this.getFontFamily()).replace(/[. "]/g, '-');
  }

  addText(...texts: string[]) {
    for (const text of texts) {
      if (!text) continue;
      const normalized = text.normalize('NFC');
      for (const ch of normalized) {
        this.chars.add(ch);
      }
    }
  }

  getChars() {
    return new Set(this.chars);
  }

  /**
   * 获取 @font-face 的 CSS 代码
   */
  getFontFaceCss(): string {
    if (!this.minFont) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    return `@font-face{font-family:"${this.getFontFamily()}";src:url("${this.getFontPath()}")format('woff2')}`;
  }

  /**
   * 获取 className 的 CSS 代码
   */
  getClassNameCss(): string {
    if (!this.minFont) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    const className = this.getClassName();
    const fontFamily = this.getFontFamily();
    const fallback = this.options.fallbackFont ?? 'sans-serif';
    return `.${className}{font-family:"${fontFamily}",${fallback}}`;
  }

  async build(buildOptions: FontBucketBuildOptions = {}) {
    const options = { ...this.options, ...buildOptions };
    const { minify } = options;

    let fontBuffer: Buffer;

    if ('fontContent' in options && options.fontContent) {
      fontBuffer = options.fontContent;
    } else if (options.fontSource && options.getFontContent) {
      fontBuffer = await options.getFontContent(options.fontSource);
    } else if (options.fontSource) {
      fontBuffer = await fs.readFile(options.fontSource);
    } else {
      throw new Error('FontBucket: 需要提供 fontSource 或 fontContent 至少一个');
    }

    const inputFontPath = normalize(
      this.options.publicPath ?? '/',
      options.fontFile ?? (minify ? '/fonts/font.woff2' : `/fonts/font-${Date.now()}.woff2`),
    );
    const inputCssPath = normalize(
      this.options.publicPath ?? '/',
      options.cssFile ?? (minify ? '/styles/font.css' : `/styles/font-${Date.now()}.css`),
    );

    if (minify !== false) {
      this.minFont = await this.subsetFont(fontBuffer);
    } else {
      this.minFont = fontBuffer;
    }

    this.resolvedFontPath = options.rename
      ? options.rename({ path: inputFontPath, content: this.minFont })
      : inputFontPath;

    // 外部没有指定字体名称，则使用文件名作为字体名称
    this.resolvedFontName = toPinyin(
      options.fontFamily ? options.fontFamily.replace(/"/g, '') : parse(this.resolvedFontPath).name,
    );

    // 组合 font-face 和 className 的 CSS
    const fontFaceCss = this.getFontFaceCss();
    const classNameCss = this.getClassNameCss();

    this.cssCode = `${fontFaceCss}${classNameCss}`;
    this.resolvedCssPath = options.rename
      ? options.rename({ path: inputCssPath, content: Buffer.from(this.cssCode) })
      : inputCssPath;
  }

  getFont(): AssetData {
    if (!this.minFont) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    return {
      path: this.getFontPath(),
      content: this.minFont,
    };
  }

  getCss(): AssetData {
    if (!this.cssCode) {
      throw new Error('样式文件未生成，请先运行 build 方法');
    }

    return {
      path: this.getCssPath(),
      content: Buffer.from(this.cssCode),
    };
  }
}
