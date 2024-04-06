import type { ListRenderData } from '@blog/types';
import { normalize, normalizeUrl } from '@blog/node';
import { Builder } from '@blog/context/runtime';
import { MainIndex, utils } from '@blog/template-layout';
import { createHtml } from './react';
import { site } from '../../constant';

const createIndex = createHtml(MainIndex);

export function getIndexUrlPath(index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath)
    : normalizeUrl(Builder.options.publicPath, 'index', String(index));
}

export function getIndexAssetPath(index: number) {
  return normalize(getIndexUrlPath(index), 'index.html');
}

export function renderListPage({ index, pathname, posts, count }: ListRenderData) {
  const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createIndex({
    posts,
    index,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    pre: isEnd ? undefined : getIndexUrlPath(index + 1),
    next: isStart ? undefined : getIndexUrlPath(index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}
