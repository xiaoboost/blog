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

export class FontBucket implements IFontBucket {
  private options: IFontBucketOptions;

  private chars = new Set<string>();

  private minFont: Buffer | null = null;
  private cssCode: string | null = null;

  /** build 后确定的路径 */
  private fontPath: string | null = null;
  private cssPath: string | null = null;

  /** build 后确定的字体家族名 */
  private fontName: string | null = null;

  constructor(options: IFontBucketOptions) {
    this.options = { ...options };
  }

  get isBuilt() {
    return this.minFont !== null && this.cssCode !== null;
  }

  get isEmpty() {
    return this.chars.size === 0;
  }

  getClassName(): string {
    return (this.options.className ?? this.getFontFamily()).replace(/[. "]/g, '-');
  }

  addText(...texts: string[]) {
    for (const text of texts) {
      if (!text) continue;
      for (const ch of text.normalize('NFC')) {
        this.chars.add(ch);
      }
    }
  }

  getChars() {
    return new Set(this.chars);
  }

  getFontFaceCss(): string {
    if (!this.fontPath) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    return `@font-face{font-family:"${this.getFontFamily()}";src:url("${this.fontPath}")format('woff2')}`;
  }

  getClassNameCss(): string {
    if (!this.minFont) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    const className = this.getClassName();
    const fontFamily = this.getFontFamily();
    const fallback = this.options.fallbackFont ?? 'sans-serif';
    return `.${className}{font-family:"${fontFamily}",${fallback}}`;
  }

  async build(buildOptions: IFontBucketBuildOptions) {
    if (this.isBuilt) {
      return;
    }

    const options = { ...this.options, ...buildOptions };
    const {
      format,
      scope = '/',
      cssFileName = 'font',
      minify = true,
    } = options;

    let fontBuffer: Buffer;

    if (options.fontContent) {
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

    if (minify) {
      this.minFont = await this.subsetFont(fontBuffer);
    }
    else {
      this.minFont = fontBuffer;
    }

    // 字体文件名从 fontFamily 自动派生，不依赖 cssFileName
    this.fontName = toPinyin(
      options.fontFamily
        ? options.fontFamily.replace(/"/g, '')
        : cssFileName,
    );

    this.fontPath = normalize(scope, format({ path: `${this.fontName}.woff2`, content: this.minFont }));

    this.cssCode = `${this.getFontFaceCss()}${this.getClassNameCss()}`;
    this.cssPath = normalize(scope, format({ path: `${cssFileName}.css`, content: Buffer.from(this.cssCode) }));
  }

  getFont(): AssetData {
    if (!this.minFont || !this.fontPath) {
      throw new Error('字体文件未生成，请先运行 build 方法');
    }

    return { path: this.fontPath, content: this.minFont };
  }

  getCss(): AssetData {
    if (!this.cssCode || !this.cssPath) {
      throw new Error('样式文件未生成，请先运行 build 方法');
    }

    return { path: this.cssPath, content: Buffer.from(this.cssCode) };
  }

  private getFontFamily() {
    return this.fontName ?? (this.options.fontFamily ?? 'font').replace(/"/g, '');
  }

  private async subsetFont(font: Buffer): Promise<Buffer> {
    const text = Array.from(this.chars).join('') || ' ';
    return subsetFont(font, text, {
      targetFormat: 'woff2',
      noLayoutClosure: true,
    });
  }
}
