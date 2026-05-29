import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { normalize, normalizeUrl } from '@blog/node';
import { MainIndex, utils } from '@blog/template-layout';
import type { PostListData } from '@blog/types';
import { site } from '../../constant';
import { createHtml } from './react';

const createIndex = createHtml(MainIndex);

export function getIndexUrlPath(index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath)
    : normalizeUrl(Builder.options.publicPath, 'index', String(index));
}

export function getIndexAssetPath(index: number) {
  return normalize(getIndexUrlPath(index), 'index.html');
}

export function renderListPage({ index, pathname, posts, count }: PostListData) {
  const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createIndex({
    posts,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    older: isEnd ? undefined : getIndexUrlPath(index + 1),
    newer: isStart ? undefined : getIndexUrlPath(index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
    preloadAssets: utils.getPreloadAssets(),
  });
}
