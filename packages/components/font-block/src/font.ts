import { builderOptions as env } from '@blog/context/runtime';
import { dirname, parse } from 'path';
import { FontSerif } from '@blog/styles';
import { toPinyin, normalize } from '@blog/node';
import type { AssetData, PostExportData } from '@blog/types';
import CleanCSS from 'clean-css';
import { CustomFontData } from './types';
import { getFontContentBySrc, getMinFontFile } from './utils';

export class CustomFont implements CustomFontData {
  src: string;

  post: string;

  text: string[] = [];

  charSet = new Set<string>();

  /** 最小化字体文件 */
  private minFont = Buffer.from('');

  /** 样式代码 */
  private cssCode = '';

  /** 静态资源 */
  private assets: AssetData[] = [];

  constructor(src: string, post: string, text: string[] = []) {
    this.src = src;
    this.post = post;
    text.forEach((item) => this.addText(item));
  }

  /**
   * 元素所在类名
   *   - 字体文件名转为拼音
   */
  get className() {
    return toPinyin(this.fontFamily);
  }

  /**
   * 字体名称
   *   - 字体文件的文件名（不包含后缀）
   */
  get fontFamily() {
    return parse(this.src).name.replace(/\s+/g, '');
  }

  /**
   * TODO: 现在存在的问题是如何复用文件提取和命名的逻辑？
   */

  /** 字体文件名称 */
  get fontFileName() {
    return '';
  }

  /** 样式文件路径 */
  get cssFileName() {
    return '';
  }

  /** 生成自定义字体数据 */
  private async getCustomFontContent() {
    if (this.minFont.byteLength > 0) {
      return;
    }

    let original = await getFontContentBySrc(this.src);

    // 生产模式需要最小化字体
    if (env.mode === 'production') {
      original = await getMinFontFile(original, this.charSet);
    }

    this.minFont = original;
  }

  /** 生成自定义字体样式代码 */
  private getCssCode() {
    if (this.cssCode.length > 0) {
      return this.cssCode;
    }

    const code = `
      @font-face {
        font-family: "${this.fontFamily}";
        src: url("./${this.fontFileName}");
      }

      .${this.className} {
        font-family: "${this.fontFamily}", ${FontSerif};
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
      .filter((item) => item.length > 0)
      .forEach((key) => this.charSet.add(key));
  }

  /** 生成静态资源 */
  async getAssets(): Promise<AssetData[]> {
    if (this.assets.length > 0) {
      return this.assets.slice();
    }

    // TODO:
    this.assets = [
      {
        path: '', // normalize(dirname(this.post)),
        content: this.minFont,
      },
      {
        path: '',
        content: Buffer.from(this.cssCode),
      },
    ];

    return this.assets.slice();
  }
}
