import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { FontSerif } from '@blog/styles';
import { FontBucket, normalize } from '@blog/node';
import type { AssetData } from '@blog/types';
import { CustomFontData } from './types';
import { getFontContentBySrc } from './utils';

export class CustomFont extends FontBucket implements CustomFontData {
  readonly src: string;

  readonly post: string;

  readonly text: string[] = [];

  constructor(src: string, post: string, text: string[] = []) {
    const minify = Builder.options.mode === 'production';

    super({
      fontSource: normalize(src),
      fontFile: normalize(`${post}/fonts/font.woff2`),
      cssFile: normalize(`${post}/styles/font.css`),
      publicPath: Builder.options.publicPath,
      minify,
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

    debugger;
    return [this.getFont(), this.getCss()];
  }
}
