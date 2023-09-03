import React from 'react';

import type { PostExportDataWithComponent, PostUrlMap, PostsExportType } from '@blog/types';
import { normalize, normalizeUrl } from '@blog/node';
import { Post as PostRender } from '@blog/template-post';
import { utils as layoutUtils } from '@blog/template-layout';
import { RuntimeBuilder as Builder } from '@blog/context/runtime';

import { createHtml } from './react';
import { site } from '../../constant';

const createPost = createHtml(PostRender);

export function filterSortPosts(posts: PostsExportType) {
  return posts
    .filter(({ data }) => data.public)
    .sort((pre, next) => (pre.data.create > next.data.create ? -1 : 1));
}

export function getPostUrlMap(posts: PostsExportType) {
  const map: PostUrlMap = new Map();

  posts.forEach((post) => {
    const pathname = getPostUrlPath(post);
    post.data.pathname = pathname;
    map.set(post.data.filePath, pathname);
  });

  return map;
}

export function getPostUrlPath(post: PostExportDataWithComponent) {
  return normalizeUrl(Builder.options.publicPath, post.data.pathname);
}

export function getPostAssetPath(post: PostExportDataWithComponent) {
  return normalize(post.data.pathname, 'index.html');
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
  const html = createPost({
    pageTitle: post.data.title,
    siteTitle: site.title,
    pathname: post.data.pathname,
    author: site.author,
    description: post.data.description,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    styles: layoutUtils.getStyleNames().concat(post.utils.getStyleNames()),
    scripts: layoutUtils.getScriptNames().concat(post.utils.getScriptNames()),
    post,
  });

  return html;
}
