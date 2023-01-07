import type { ListRenderData } from '@blog/types';
import { normalize, normalizeUrl } from '@blog/node';
import { builderOptions } from '@blog/context/runtime';
import { MainIndex, utils } from '@blog/template-layout';
import { createHtml } from './react';
import { site } from '../../constant';

const createIndex = createHtml(MainIndex);

export function getIndexUrlPath(index: number) {
  return index === 0
    ? normalizeUrl(builderOptions.publicPath)
    : normalizeUrl(builderOptions.publicPath, 'index', String(index));
}

export function getIndexAssetPath(index: number) {
  return normalize(getIndexUrlPath(index), 'index.html');
}

export function renderListPage({ index, pathname, posts, count }: ListRenderData) {
  const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

  return createIndex({
    posts,
    index,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: builderOptions.publicPath,
    hmr: builderOptions.hmr,
    next: index < count ? getIndexUrlPath(index + 1) : undefined,
    pre: index > 0 ? getIndexUrlPath(index - 1) : undefined,
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}
