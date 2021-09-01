import path from 'path';

import { AssetData } from '@blog/utils';
import { site, pageConfig, publicPath } from '@blog/config';
import { default as inputs } from '@blog/posts';
import { IndexRender } from '@blog/template-view';
import { cut } from '@xiao-ai/utils';
import { createHtml } from './utils';
import { layout } from './chunk';

function build(): AssetData[] {
  const createIndex = createHtml(IndexRender);
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

  return pagePosts.map((page, index) => {
    const pathname = getPathname(index)!;
    const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

    return {
      path: path.join(publicPath, pathname!),
      contents: createIndex({
        posts: page,
        siteTitle: site.title,
        pageTitle,
        pathname,
        publicPath,
        next: getPathname(index + 1),
        pre: getPathname(index - 1),
        styles: layout.styles,
        scripts: layout.scripts,
      }),
    };
  });
}

export const assets = build();
