import React from 'react';
import path from 'path';
import posts from '@blog/posts';

import { normalize } from '@blog/shared/node';
import { Post as PostRender } from '@blog/template-post';
import { getAssetNames as getLayoutAssetNames } from '@blog/template-layout';

import { createHtml } from './react';
import { site, publicPath } from '../utils';
import { PostRendered } from '../bundler/plugins/loader-post/types';

/**
 * 文章组件空运行
 *   - 部分组件需要预载
 */
export function runPostComponent() {
  posts.forEach(({ Component }) => {
    React.createElement(Component);
  });
}

function getPostHtml(post: PostRendered) {
  const createPost = createHtml(PostRender);
  const html = createPost({
    pageTitle: post.title,
    siteTitle: site.title,
    pathname: post.pathname,
    author: site.author,
    description: post.description,
    publicPath: publicPath,
    assets: getLayoutAssetNames().concat(
      post.getComponentAssetNames(),
      post.getTemplateAssetNames(),
    ),
    post: post as any,
  });

  return html;
}

/**
 * 获取文章静态资源
 *   - TODO: 获取文章本身引用的资源
 */
export function getPostAssets(): Promise<AssetData[]> {
  const assets: AssetData[] = [];

  for (const post of posts) {
    assets.push({
      path: normalize(path.join('/', post.pathname, 'index.html')),
      content: getPostHtml(post),
    });
  }

  return Promise.resolve(assets);
}
