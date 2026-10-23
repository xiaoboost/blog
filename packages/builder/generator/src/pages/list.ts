import { normalize, normalizeUrl } from '@blog/node';
import { MainIndex } from '@blog/template-layout';
import type { IRenderContext, ISite, PostExportData } from '@blog/types';
import { pageConfig } from '../constant';
import { Page } from '../model/page';
import { paginate } from '../utils/pagination';
import { createHtml } from '../utils/react';

const createIndex = createHtml(MainIndex);

export function getIndexUrlPath(site: ISite, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath)
    : normalizeUrl(site.publicPath, 'index', String(index));
}

export function getIndexAssetPath(site: ISite, index: number) {
  return normalize(getIndexUrlPath(site, index), 'index.html');
}

export function createIndexPages(site: ISite, posts: PostExportData[]) {
  return paginate(
    posts,
    pageConfig.index,
    (i) => getIndexUrlPath(site, i),
    (chunk, nav) => new Page({
      type: 'index',
      pathname: getIndexUrlPath(site, nav.index),
      title: nav.index === 0 ? site.title : `${site.title} | 第 ${nav.index + 1} 页`,
      data: { posts: chunk, ...nav },
      render: renderListPage,
    }),
  );
}

function renderListPage(ctx: IRenderContext<'index'>) {
  const { page, site } = ctx;
  const { index, count, ...data } = page.data;

  return createIndex({
    ...ctx,
    ...data,
    numbered: { index, count, urlForIndex: (i) => getIndexUrlPath(site, i) },
  });
}
