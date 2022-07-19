import path from 'path';

import { MainIndex, getAssetNames } from '@blog/template-layout';
import { default as inputs } from '@blog/posts';
import { normalize } from '@blog/shared/node';
import { cut } from '@xiao-ai/utils';
import { createHtml } from './react';
import { site, publicPath, pageConfig } from '../utils';

/** 获取网站各列表页静态资源 */
export function getListAssets(): Promise<AssetData[]> {
  const createIndex = createHtml(MainIndex);
  const posts = inputs.filter((post) => post.public);
  const pagePosts = cut(posts, pageConfig.index);
  const getPathname = (index: number) => {
    if (index < 0) {
      return null;
    }

    if (index > pagePosts.length - 1) {
      return null;
    }

    return index === 0
      ? path.join(publicPath, 'index.html')
      : path.join(publicPath, 'index', String(index), 'index.html');
  };

  const result = pagePosts.map((page, index) => {
    const pathname = getPathname(index)!;
    const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

    return {
      path: normalize(path.join(publicPath, pathname!)),
      content: createIndex({
        posts: page,
        siteTitle: site.title,
        pageTitle,
        pathname,
        publicPath,
        hmr: process.env.HMR,
        next: getPathname(index + 1),
        pre: getPathname(index - 1),
        assets: getAssetNames(),
      }),
    };
  });

  return Promise.resolve(result);
}
