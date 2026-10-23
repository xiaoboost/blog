import { defineUtils, withScriptOptions } from '@blog/context/runtime';
import type { IRenderContext, TemplateAsset } from '@blog/types';
import layoutAssets from '../../layout.script';
import themeAssets from '../theme-toggle/theme.script';

/** 每次渲染读取最新引用，保留字体构建和 beforePageRender 追加的资源。 */
export function getDocumentResources(
  { site, page }: Pick<IRenderContext, 'site' | 'page'>,
  assets: readonly TemplateAsset[] = [],
) {
  const resources = defineUtils([
    ...[site, page].flatMap((source): TemplateAsset[] => [
      ...source.getStyles(),
      ...source.getScripts().map((script) => ({ ...script, position: 'body' as const })),
      ...source.getPreScripts().map((script) => ({ ...script, position: 'head' as const })),
      ...source.getPreloads(),
    ]),
    ...layoutAssets,
    ...withScriptOptions(themeAssets, { position: 'head' }),
    ...assets,
  ]);

  return {
    styles: resources.getStyles(),
    scripts: resources.getScripts(),
    preScripts: resources.getPreScripts(),
    preloadAssets: resources.getPreloadAssets(),
  };
}
