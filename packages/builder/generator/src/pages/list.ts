import { normalize, normalizeUrl } from '@blog/node';
import { MainIndex, utils, type PaginationProps, type MainIndexProps } from '@blog/template-layout';
import type { IRenderContext, ISite } from '@blog/types';
import { createHtml } from '../react';

const createIndex = createHtml(MainIndex);

export function getIndexUrlPath(site: ISite, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath)
    : normalizeUrl(site.publicPath, 'index', String(index));
}

export function getIndexAssetPath(site: ISite, index: number) {
  return normalize(getIndexUrlPath(site, index), 'index.html');
}

export interface IndexPageRenderProps
  extends IRenderContext, Pick<MainIndexProps, 'posts'>, PaginationProps {
  index: number;
  count: number;
}

export function renderListPage({
  page,
  site,
  posts,
  older,
  newer,
  index,
  dev,
  isPreBuild,
}: IndexPageRenderProps) {
  const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

  return createIndex({
    posts,
    siteTitle: site.title,
    pageTitle,
    pathname: page.pathname,
    publicPath: site.publicPath,
    hmr: dev,
    older,
    newer,
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...utils.getStyleNames(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...utils.getScriptNames(),
    ],
    preloadAssets: [
      ...site.getPreloads(),
      ...page.getPreloads(),
      ...utils.getPreloadAssets(),
    ],
    page,
    site,
    isPreBuild,
  });
}
