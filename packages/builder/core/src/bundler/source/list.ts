import type { ListRenderData } from '@blog/types';
import { join } from 'path';
import { normalize } from '@blog/node';
import { builderOptions } from '@blog/context/runtime';
import { MainIndex, utils } from '@blog/template-layout';
import { createHtml } from './react';
import { site } from '../../constant';

const createIndex = createHtml(MainIndex);

export function getIndexPathname(index: number) {
  return index === 0
    ? normalize(join(builderOptions.publicPath, 'index.html'))
    : normalize(join(builderOptions.publicPath, 'index', String(index), 'index.html'));
}

export function renderListPage({ index, pathname, posts }: ListRenderData) {
  const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

  return createIndex({
    posts,
    index,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: builderOptions.publicPath,
    hmr: builderOptions.hmr,
    next: getIndexPathname(index + 1),
    pre: getIndexPathname(index - 1),
    assets: utils.getAssetNames(),
  });
}
