import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { FontSerif } from '@blog/styles';
import { FontBucket, toPinyin } from '@blog/node';
import type { AssetData } from '@blog/types';
import { CustomFontData } from './types';

export class CustomFont extends FontBucket implements CustomFontData {
  readonly src: string;

  readonly post: string;

  readonly text: string[] = [];

  constructor(src: string, post: string, text: string[] = []) {
    const fontFamily = `font-${Date.now()}`;
    const className = toPinyin(fontFamily);
    super({
      fontSource: src,
      fontPath: `fonts/${className}.woff2`,
      cssPath: `styles/${className}.css`,
      publicPath: Builder.options.publicPath,
      minify: Builder.options.mode === 'production',
      fontFamily,
      className,
      fallbackFont: FontSerif,
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
