import React from 'react';

import type { PostExportDataWithComponent, PostUrlMap, PostsExportType } from '@blog/types';
import { Post as PostRender } from '@blog/template-post';
import { utils as layoutUtils } from '@blog/template-layout';
import { builderOptions } from '@blog/context/runtime';

import { createHtml } from './react';
import { site } from '../../constant';

export function getPostUrlMap(posts: PostsExportType) {
  const map: PostUrlMap = new Map();

  posts.forEach(({ data }) => {
    map.set(data.filePath, data.pathname);
  });

  return map;
}

/**
 * 文章组件空运行
 *   - 部分组件需要预载
 */
export function renderSpacePost(posts: PostsExportType) {
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
    publicPath: builderOptions.publicPath,
    hmr: builderOptions.hmr,
    assets: layoutUtils.getAssetNames().concat(post.utils.getAssetNames()),
    post: post as any,
  });

  return html;
}
