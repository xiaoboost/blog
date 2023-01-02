import React from 'react';
import posts from '@blog/posts';

import type { PostExportDataWithComponent } from '@blog/types';
import { Post as PostRender } from '@blog/template-post';
import { utils as layoutUtils } from '@blog/template-layout';
import { builderOptions } from '@blog/context/runtime';

import { createHtml } from './react';
import { site, publicPath } from '../../constant';

/**
 * 文章组件空运行
 *   - 部分组件需要预载
 */
export function renderSpacePost() {
  posts.forEach(({ Component }) => {
    React.createElement(Component);
  });
}

export function renderPost(post: PostExportDataWithComponent) {
  const createPost = createHtml(PostRender);
  const html = createPost({
    pageTitle: post.data.title,
    siteTitle: site.title,
    pathname: post.data.pathname,
    author: site.author,
    description: post.data.description,
    publicPath,
    hmr: builderOptions.hmr,
    assets: layoutUtils.getAssetNames().concat(post.utils.getAssetNames()),
    post: post as any,
  });

  return html;
}
