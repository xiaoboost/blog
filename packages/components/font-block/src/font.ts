import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { FontSerif } from '@blog/styles';
import { toPinyin, normalize } from '@blog/node';
import type { AssetData } from '@blog/types';
import CleanCSS from 'clean-css';
import { CustomFontData } from './types';
import { getFontContentBySrc, getMinFontFile } from './utils';

export class CustomFont implements CustomFontData {
  src: string;

  post: string;

  text: string[] = [];

  /** 字符集 */
  charSet = new Set<string>();

  /** 最小化字体文件 */
  private minFont = Buffer.from('');

  /** 样式代码 */
  private cssCode = '';

  /** 静态资源 */
  private assets: AssetData[] = [];

  /** 字体名称 */
  private readonly fontFamily: string;

  constructor(src: string, post: string, text: string[] = []) {
    this.src = src;
    this.post = post;
    this.fontFamily = `custom-font-${Date.now()}`;
    text.forEach((item) => this.addText(item));
  }

  /**
   * 元素所在类名
   *   - 字体文件名转为拼音
   */
  get className() {
    return toPinyin(this.fontFamily);
  }

  /** 字体文件名称 */
  get fontFileName() {
    return (
      Builder.renameAsset({
        path: `${this.className}.woff2`,
        content: this.minFont,
      }) ?? normalize(Builder.options.publicPath, this.post, `${this.className}.woff2`)
    );
  }

  /** 样式文件路径 */
  get cssFileName() {
    return (
      Builder.renameAsset({
        path: `${this.className}.css`,
        content: Buffer.from(this.cssCode),
      }) ?? normalize(Builder.options.publicPath, this.post, `${this.className}.css`)
    );
  }

  /** 生成自定义字体数据 */
  private async getCustomFontContent() {
    if (this.minFont.byteLength > 0) {
      return;
    }

    let original = await getFontContentBySrc(this.src);

    // 生产模式需要最小化字体
    if (Builder.options.mode === 'production') {
      original = await getMinFontFile(original, this.charSet);
    }

    this.minFont = original;
  }

  /** 生成自定义字体样式代码 */
  private getCssCode() {
    if (this.cssCode.length > 0) {
      return this.cssCode;
    }

    const { fontFileName, fontFamily, className } = this;
    const code = `
      @font-face {
        font-family: "${fontFamily}";
        src: url("${fontFileName}");
      }

      .${className} {
        font-family: "${fontFamily}", ${FontSerif};
      }
    `;

    const { errors, styles: minifiedCode } = new CleanCSS().minify(code);

    if (errors.length > 0) {
      throw errors;
    }

    this.cssCode = minifiedCode;
    return minifiedCode;
  }

  /** 添加文本 */
  addText(text: string) {
    this.text.push(text);

    Array.from(text)
      .filter((item) => item.trim().length > 0)
      .forEach((key) => this.charSet.add(key));
  }

  /** 生成静态资源 */
  async getAssets(): Promise<AssetData[]> {
    if (this.assets.length > 0) {
      return this.assets.slice();
    }

    await this.getCustomFontContent();
    this.getCssCode();

    this.assets = [
      {
        path: this.fontFileName,
        content: this.minFont,
      },
      {
        path: this.cssFileName,
        content: Buffer.from(this.cssCode),
      },
    ];

    return this.assets.slice();
  }
}
