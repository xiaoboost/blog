import { FontBucket, normalize } from '@blog/node';
import type {
  AssetData,
  IFontBucket,
  IResourceSet,
  PreloadAssetData,
  IBuildFontsOptions,
} from '@blog/types';

export abstract class ResourceSet implements IResourceSet {
  #styles: string[] = [];
  #scripts: string[] = [];
  #preloads: PreloadAssetData[] = [];
  #assets: AssetData[] = [];
  #fontBuckets = new Map<string, FontBucket>();

  addStyle(path: string): void {
    if (!this.#styles.includes(path)) {
      this.#styles.push(path);
    }
  }

  getStyles(): string[] {
    return this.#styles.slice();
  }

  addScript(path: string): void {
    if (!this.#scripts.includes(path)) {
      this.#scripts.push(path);
    }
  }

  getScripts(): string[] {
    return this.#scripts.slice();
  }

  addPreload(preload: PreloadAssetData): void {
    this.#preloads.push(preload);
  }

  getPreloads(): PreloadAssetData[] {
    return this.#preloads.slice();
  }

  ensureFontBucket(family: string, source: Buffer): IFontBucket {
    let bucket = this.#fontBuckets.get(family);
    if (!bucket) {
      bucket = new FontBucket({ fontContent: source, fontFamily: family });
      this.#fontBuckets.set(family, bucket);
    }
    return bucket as IFontBucket;
  }

  getFontBucket(family: string): IFontBucket {
    const bucket = this.#fontBuckets.get(family);
    if (!bucket) {
      throw new Error(`FontBucket "${family}" 未注册`);
    }
    return bucket as IFontBucket;
  }

  getFontBuckets(): ReadonlyMap<string, IFontBucket> {
    return this.#fontBuckets as ReadonlyMap<string, IFontBucket>;
  }

  addAsset(asset: AssetData): void {
    this.#assets.push(asset);
  }

  getAssets(): AssetData[] {
    return this.#assets.slice();
  }

  async buildFonts({
    scope = '/',
    fileName = 'font',
    format,
    families,
  }: IBuildFontsOptions): Promise<void> {
    let entries: [string, FontBucket][];

    if (families) {
      for (const name of families) {
        this.getFontBucket(name);
      }
      entries = families
        .map((name) => [name, this.#fontBuckets.get(name)!] as [string, FontBucket])
        .filter(([, b]) => !b.isEmpty && !b.isBuilt);
    }
    else {
      entries = [...this.#fontBuckets.entries()]
        .filter(([, b]) => !b.isEmpty && !b.isBuilt);
    }

    if (entries.length === 0) return;

    // 构建字体桶
    await Promise.all(entries.map(([, b]) => b.build({ format, fileName, scope })));

    // 合并 CSS
    const css = entries.map(([, b]) => b.getFontFaceCss()).join('');
    const cssFinal = normalize(scope, format({ path: `${fileName}.css`, content: Buffer.from(css) }));

    this.addStyle(cssFinal);
    this.addAsset({ path: cssFinal, content: Buffer.from(css) });

    // 字体文件（路径已含 scope）
    for (const [, b] of entries) {
      const fontAsset = b.getFont();
      this.addAsset(fontAsset);
      this.addPreload({ href: fontAsset.path, as: 'font', type: 'font/woff2' });
    }
  }
}
