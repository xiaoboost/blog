import { Buffer } from 'node:buffer';
import fs from 'node:fs/promises';
import type { AssetData } from '@blog/types';
import FontMin from 'fontmin';
import CleanCss from 'clean-css';
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
}

interface FontBucketBaseOptions extends FontBucketBuildOptions {
  /**
   * 样式文件路径
   */
  cssPath: string;
  /**
   * 子集文件路径
   */
  fontPath: string;
  /**
   * 字体名称
   * @description 用于生成 CSS 中的字体名称
   */
  fontFamily: string;
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

  /** 解析出的字体地址 */
  private resolvedFontPath: string | null = null;

  /** 解析出的样式地址 */
  private resolvedCssPath: string | null = null;

  constructor(options: FontBucketOptions) {
    this.options = { ...options };
  }

  /** 字体文件 URL 路径 */
  private getFontPath() {
    return normalize(
      this.options.publicPath ?? '/',
      this.resolvedFontPath ?? this.options.fontPath,
    );
  }

  /** 样式文件 URL 路径 */
  private getCssPath() {
    return normalize(this.options.publicPath ?? '/', this.resolvedCssPath ?? this.options.cssPath);
  }

  get isBuilt() {
    return this.minFont !== null && this.cssCode !== null;
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
   * 使用 FontMin 对字体做子集化并转为 woff2
   */
  private async subsetFont(font: Buffer): Promise<Buffer> {
    const text = Array.from(this.chars).join('') || '';
    return new Promise((resolve, reject) => {
      new FontMin()
        .src(font)
        .use(
          FontMin.glyph({
            text,
            hinting: false,
          }),
        )
        .use(FontMin.ttf2woff2())
        .run((err, files) => {
          if (err) {
            reject(err);
            return;
          }
          const out = files as unknown as Array<{ basename: string; contents: Uint8Array }>;
          const woff2 = out.find((f) => f.basename.endsWith('.woff2'));
          if (woff2?.contents) {
            resolve(Buffer.from(woff2.contents));
          } else {
            reject(new Error('字体子集化失败'));
          }
        });
    });
  }

  async build(buildOptions: FontBucketBuildOptions = {}) {
    const options = { ...this.options, ...buildOptions };
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
    const minify = options.minify !== false;

    if (minify) {
      this.minFont = await this.subsetFont(fontBuffer);
    } else {
      this.minFont = fontBuffer;
    }

    this.resolvedFontPath = options.rename
      ? options.rename({ path: options.fontPath, content: this.minFont })
      : options.fontPath;

    const className = this.getClassName();
    const { fontFamily, fallbackFont } = options;
    const fallback = fallbackFont ?? 'sans-serif';
    const code = `
      @font-face {
        font-family: "${fontFamily}";
        src: url("${this.getFontPath()}");
      }

      .${className} {
        font-family: "${fontFamily}", ${fallback};
      }
    `;

    if (minify) {
      const { errors, styles } = new CleanCss().minify(code);
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      this.cssCode = styles;
    } else {
      this.cssCode = code.trim();
    }

    this.resolvedCssPath = options.rename
      ? options.rename({
          path: options.cssPath,
          content: Buffer.from(this.cssCode),
        })
      : options.cssPath;
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

  getClassName(): string {
    return this.options.className ?? toPinyin(this.options.fontFamily);
  }

  getFontFamily(): string {
    return this.options.fontFamily;
  }
}
