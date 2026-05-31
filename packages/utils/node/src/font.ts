import { Buffer } from 'buffer';
import fs from 'fs/promises';
import { parse } from 'path';
import type {
  AssetData,
  IFontBucket,
  IFontBucketBuildOptions,
  IFontBucketOptions,
} from '@blog/types';
import subsetFont from 'subset-font';
import { normalize } from './path';
import { toPinyin } from './string';

let index = 1;

export class FontBucket implements IFontBucket {
  private options: IFontBucketOptions;

  private chars = new Set<string>();

  private cssCode: string | null = null;

  private minFont: Buffer | null = null;

  /** 解析出的字体名称 */
  private resolvedFontName: string | null = null;

  /** 解析出的字体地址 */
  private resolvedFontPath: string | null = null;

  /** 解析出的样式地址 */
  private resolvedCssPath: string | null = null;

  constructor(options: IFontBucketOptions) {
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

  async build(buildOptions: IFontBucketBuildOptions = {}) {
    // 已经构建过了，那就直接跳过
    // 目前并没有需要监听 Char 变更重构建的需求
    if (this.isBuilt) {
      return;
    }

    const options = { ...this.options, ...buildOptions };
    const { minify } = options;

    let fontBuffer: Buffer;

    if ('fontContent' in options && options.fontContent) {
      fontBuffer = options.fontContent;
    }
    else if (options.fontSource && options.getFontContent) {
      fontBuffer = await options.getFontContent(options.fontSource);
    }
    else if (options.fontSource) {
      fontBuffer = await fs.readFile(options.fontSource);
    }
    else {
      throw new Error('FontBucket: 需要提供 fontSource 或 fontContent 至少一个');
    }

    const family = this.getFontFamily();
    const fileBaseName = minify ? '/fonts/font' : `/fonts/font-${index++}`;
    const inputFontPath = normalize(
      this.options.publicPath ?? '/',
      options.fontFile?.replace('{family}', family) ?? `${fileBaseName}.woff2`,
    );
    const inputCssPath = normalize(
      this.options.publicPath ?? '/',
      options.cssFile ?? `${fileBaseName}.css`,
    );

    if (minify !== false) {
      this.minFont = await this.subsetFont(fontBuffer);
      this.resolvedFontPath = options.rename
        ? options.rename({ path: inputFontPath, content: this.minFont })
        : inputFontPath;
    }
    else {
      this.minFont = fontBuffer;
      // 不进行最小化时，为了加速构建，这里重命名使用内部的 Text 文本作为 hash
      this.resolvedFontPath = options.rename
        ? options.rename({
          path: inputFontPath,
          content: Buffer.from(Array.from(this.chars.values()).join('')),
        })
        : inputFontPath;
    }

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
