import type { AssetData, PreloadAssetData } from './asset';
import type { IFontBucket, IBuildFontsOptions } from './font';
import type { PostExportData, PostExportDataWithComponent } from './post';

/** 页面类型 */
export type PageType =
  | 'post'
  | 'index'
  | 'tag-list'
  | 'tag-post-list'
  | 'year-list'
  | 'year-post-list';

// ── 页面数据映射 ──

/** 列表项数据 */
export interface PageItemData {
  title: string;
  subTitle: string;
  url: string;
}

/** 列表页通用数据 */
export interface PageListBase {
  index: number;
  count: number;
  older?: string;
  newer?: string;
}

/** 各页面类型对应的 data 类型 */
export interface PageDataMap {
  'post': {
    post: PostExportDataWithComponent;
  };
  'index': PageListBase & {
    posts: PostExportData[];
  };
  'tag-list': PageListBase & {
    listTitle: string;
    items: PageItemData[];
  };
  'tag-post-list': PageListBase & {
    listTitle: string;
    posts: PostExportData[];
  };
  'year-list': PageListBase & {
    listTitle: string;
    items: PageItemData[];
  };
  'year-post-list': PageListBase & {
    listTitle: string;
    posts: PostExportData[];
  };
}

// ── 资源集 ──

/** 资源集接口 — Page 和 Site 共享的资源管理能力 */
export interface IResourceSet {
  /** 添加样式资源引用 */
  addStyle(path: string): void;
  /** 获取所有样式资源引用 */
  getStyles(): string[];

  /** 添加脚本资源引用 */
  addScript(path: string): void;
  /** 获取所有脚本资源引用 */
  getScripts(): string[];

  /** 添加预加载声明 */
  addPreload(preload: PreloadAssetData): void;
  /** 获取所有预加载声明 */
  getPreloads(): PreloadAssetData[];

  /** 获取或创建字体桶 */
  ensureFontBucket(family: string, source: Buffer): IFontBucket;
  /** 获取已有的字体桶 */
  getFontBucket(family: string): IFontBucket;
  /** 获取所有字体桶 */
  getFontBuckets(): ReadonlyMap<string, IFontBucket>;
  /**
   * 构建字体并产出资源
   *   - 构建所有未构建的字体桶，并合并 CSS
   *   - 产出 CSS 文件 + 字体文件 + preload 声明
   */
  buildFonts(opts: IBuildFontsOptions): Promise<void>;

  /** 添加附属产物（字体文件、CSS 文件等） */
  addAsset(asset: AssetData): void;
  /** 获取所有附属产物 */
  getAssets(): AssetData[];
}

// ── Page ──

/** Page 实例 — 表示一个正在构建的页面 */
export interface IPage<T extends PageType = PageType> extends IResourceSet {
  readonly type: T;
  readonly pathname: string;
  readonly title: string;
  readonly data: PageDataMap[T];
  readonly render: (props: IRenderContext) => string;

  html: string;

  /** 产出最终的 HTML AssetData */
  toAsset(): AssetData;
}

// ── Site ──

/** Site 实例 — 表示全站共享的构建上下文 */
export interface ISite extends IResourceSet {
  readonly title: string;
  readonly publicPath: string;
  readonly author?: string;
  readonly description?: string;
  readonly aboutPath: string;
  readonly tagPath: string;
  readonly archivePath: string;
}

// ── Hook 上下文 ──

/** 构建上下文 — 传入 hook 的统一参数 */
export interface BuildContext {
  pages: IPage[];
  site: ISite;
  logger: Pick<Console, 'info' | 'debug' | 'error'>;
  rename: (asset: AssetData) => string;
}

/** 带当前页面的构建上下文 */
export interface BuildContextWithPage extends BuildContext {
  page: IPage;
}

// ── Render ──

/** 渲染上下文 */
export interface IRenderContext {
  page: IPage;
  site: ISite;
  dev: boolean;
  isPreBuild: boolean;
}
