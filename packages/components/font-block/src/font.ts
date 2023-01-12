import { getAccessor, builderOptions } from '@blog/context/runtime';
import CleanCSS from 'clean-css';

export interface CustomFontData {
  /** 字体文件原始路径 */
  src: string;
  /** 原文文本 */
  text: string[];
  /** 裁剪的字体字符集 */
  charSet: Set<string>;
}

export interface MinFontData extends CustomFontData {
  /** 网页元素类名 */
  className: string;
  /** 自定义字体名称 */
  fontFamily: string;
  /** 裁剪后的字体文件数据 */
  content: Buffer;
  /** 样式代码 */
  cssCode: string;
}

export class CustomFont implements Omit<MinFontData, 'cssCode'> {
  src: string;

  text: string[] = [];

  charSet = new Set<string>();

  content = Buffer.from('');

  constructor(src: string) {
    this.src = src;
  }

  get className() {
    return '';
  }

  get fontFamily() {
    return '';
  }

  addText(text: string) {
    this.text.push(text);

    Array.from(text)
      .filter((item) => item.length > 0)
      .forEach((key) => this.charSet.add(key));
  }

  /** 生成自定义字体数据 */
  getCustomFontContent() {
    if (this.content.byteLength > 0) {
      return this.content;
    }

    if (builderOptions.mode === 'production') {
      // ..
    }
  }

  /** 生成自定义字体样式代码 */
  getCssCode() {
    return '';
  }

  toData(): MinFontData {
    // ..
  }
}
