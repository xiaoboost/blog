import { FontBucket, normalize } from '@blog/node';
import type {
  AssetData,
  IFontBucket,
  IFontBucketConfig,
  IResourceSet,
  PreloadAssetData,
  ScriptAssetData,
  StyleAssetData,
  IBuildFontsOptions,
} from '@blog/types';

export abstract class ResourceSet implements IResourceSet {
  #styles: StyleAssetData[] = [];
  #scripts: ScriptAssetData[] = [];
  #preScripts: ScriptAssetData[] = [];
  #preloads: PreloadAssetData[] = [];
  #assets: AssetData[] = [];
  #fontBuckets = new Map<string, FontBucket>();

  addStyle(style: StyleAssetData): void {
    if (!this.#styles.some(({ href }) => href === style.href)) {
      this.#styles.push(style);
    }
  }

  getStyles(): StyleAssetData[] {
    return this.#styles.slice();
  }

  addScript(script: ScriptAssetData): void {
    if (!this.#scripts.some(({ src }) => src === script.src)) {
      this.#scripts.push(script);
    }
  }

  getScripts(): ScriptAssetData[] {
    return this.#scripts.slice();
  }

  addPreScript(script: ScriptAssetData): void {
    if (!this.#preScripts.some(({ src }) => src === script.src)) {
      this.#preScripts.push(script);
    }
  }

  getPreScripts(): ScriptAssetData[] {
    return this.#preScripts.slice();
  }

  addPreload(preload: PreloadAssetData): void {
    this.#preloads.push(preload);
  }

  getPreloads(): PreloadAssetData[] {
    return this.#preloads.slice();
  }

  ensureFontBucket(family: string, source: Buffer, options?: IFontBucketConfig): IFontBucket {
    let bucket = this.#fontBuckets.get(family);
    if (!bucket) {
      bucket = new FontBucket({ ...options, fontContent: source, fontFamily: family });
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
    cssFileName = 'font',
    cssMode = 'font-face',
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
    await Promise.all(entries.map(([, b]) => b.build({ format, cssFileName, scope })));

    // 合并 CSS
    const css = entries
      .map(([, b]) => (
        cssMode === 'full'
          ? b.getCss().content
          : b.getFontFaceCss()
      ))
      .join('');
    const cssFinal = normalize(scope, format({ path: `${cssFileName}.css`, content: Buffer.from(css) }));

    this.addStyle({ href: cssFinal });
    this.addAsset({ path: cssFinal, content: Buffer.from(css) });

    // 字体文件（路径已含 scope）
    for (const [, b] of entries) {
      const fontAsset = b.getFont();
      this.addAsset(fontAsset);
      this.addPreload({ href: fontAsset.path, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
    }
  }
}
