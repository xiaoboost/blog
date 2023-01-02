import React from 'react';
import path from 'path';
import posts from '@blog/posts';

import { normalize } from '@blog/node';
import type { PostExportDataWithComponent } from '@blog/types';
import { Post as PostRender } from '@blog/template-post';
import { getAssetNames as getLayoutAssetNames } from '@blog/template-layout';

import { createHtml } from './react';
import { site, publicPath } from '../../constant';

/**
 * 文章组件空运行
 *   - 部分组件需要预载
 */
export function renderPostReady() {
  posts.forEach(({ Component }) => {
    React.createElement(Component);
  });
}

function renderPost(post: PostExportDataWithComponent) {
  const createPost = createHtml(PostRender);
  const html = createPost({
    pageTitle: post.data.title,
    siteTitle: site.title,
    pathname: post.data.pathname,
    author: site.author,
    description: post.data.description,
    publicPath,
    hmr: process.env.HMR,
    assets: getLayoutAssetNames().concat(
      post.getComponentAssetNames(),
      post.getTemplateAssetNames(),
    ),
    post: post as any,
  });

  return html;
}
