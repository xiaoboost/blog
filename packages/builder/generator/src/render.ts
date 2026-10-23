import { callHook } from '@blog/context/runtime';
import type {
  AssetData,
  BuildContext,
  IRenderContext,
  PageType,
} from '@blog/types';

interface RenderOptions {
  isPreBuild: boolean;
  dev: boolean;
}

/** 保留具体页面类型与 render 参数的对应关系，支持批量渲染不同页面。 */
function renderPage<T extends PageType>(ctx: IRenderContext<T>) {
  return ctx.page.render(ctx);
}

/** 两次渲染复用同一批实例，页面级 hooks 只在正式渲染时执行。 */
export async function renderPages(
  ctx: BuildContext,
  { isPreBuild, dev }: RenderOptions,
): Promise<AssetData[]> {
  const { site, pages } = ctx;
  const assets: AssetData[] = [];

  for (const page of pages) {
    if (!isPreBuild) {
      await callHook('beforePageRender', { ...ctx, page });
    }

    page.html = renderPage({
      page,
      site,
      isPreBuild,
      dev,
    });

    if (!isPreBuild) {
      await callHook('afterPageRender', { ...ctx, page });
    }

    assets.push(page.toAsset());
    assets.push(...page.getAssets());
  }

  assets.push(...site.getAssets());
  return assets;
}
