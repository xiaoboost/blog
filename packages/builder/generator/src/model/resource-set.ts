import { FontBucket } from '@blog/node';
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
    cssPath,
    rename,
    families,
  }: IBuildFontsOptions): Promise<void> {
    let buckets: FontBucket[];

    if (families) {
      for (const name of families) {
        this.getFontBucket(name); // 不存在会 throw
      }
      buckets = families
        .map((name) => this.#fontBuckets.get(name)!)
        .filter((b) => !b.isEmpty && !b.isBuilt);
    }
    else {
      buckets = [...this.#fontBuckets.values()]
        .filter((b) => !b.isEmpty && !b.isBuilt);
    }

    if (buckets.length === 0) return;

    await Promise.all(buckets.map((b) => b.build()));

    const css = buckets.map((b) => b.getFontFaceCss()).join('');
    const finalPath = rename({ path: cssPath, content: Buffer.from(css) });

    this.addStyle(finalPath);
    this.addAsset({ path: finalPath, content: Buffer.from(css) });

    for (const b of buckets) {
      const fontAsset = b.getFont();
      this.addAsset(fontAsset);
      this.addPreload({ href: fontAsset.path, as: 'font', type: 'font/woff2' });
    }
  }
}
