import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { FontSerif } from '@blog/styles';
import { FontBucket, toPinyin } from '@blog/node';
import type { AssetData } from '@blog/types';
import { CustomFontData } from './types';
import { getFontContentBySrc } from './utils';

export class CustomFont extends FontBucket implements CustomFontData {
  readonly src: string;

  readonly post: string;

  readonly text: string[] = [];

  constructor(src: string, post: string, text: string[] = []) {
    const minify = Builder.options.mode === 'production';
    // 最小化的时候有 hash 值，所以不需要加时间戳
    const fontFamily = minify ? 'font' : `font-${Date.now()}`;
    const className = toPinyin(fontFamily);

    super({
      fontSource: src,
      fontPath: `fonts/${className}.woff2`,
      cssPath: `styles/${className}.css`,
      publicPath: Builder.options.publicPath,
      minify,
      fontFamily,
      className,
      fallbackFont: FontSerif,
      getFontContent: getFontContentBySrc,
      rename: (asset) => Builder.renameAsset(asset) ?? asset.path,
    });
    this.src = src;
    this.post = post;
    this.text = [...text];
    this.addText(...text);
  }

  /** 生成静态资源 */
  async getAssets(): Promise<AssetData[]> {
    if (!this.isBuilt) {
      await this.build();
    }

    return [this.getFont(), this.getCss()];
  }
}
