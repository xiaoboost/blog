import { normalize, normalizeUrl } from '@blog/node';
import { utils as layoutUtils } from '@blog/template-layout';
import { Post as PostRender, type PostProps } from '@blog/template-post';
import type { IRenderContext, ISite, PostExportDataWithComponent, PostsExportType } from '@blog/types';
import React from 'react';
import { createHtml } from '../utils/react';

const createPost = createHtml(PostRender);

export function filterSortPosts(posts: PostsExportType) {
  return posts
    .filter(({ data }) => data.public)
    .filter(({ data }) => process.env.NODE_ENV !== 'production' || !data.draft)
    .sort((pre, next) => (pre.data.create > next.data.create ? -1 : 1));
}

export function getPostUrlPath(site: ISite, post: PostExportDataWithComponent) {
  return normalizeUrl(site.publicPath, post.data.pathname);
}

export function getPostAssetPath(post: PostExportDataWithComponent) {
  return normalize(post.data.pathname, 'index.html');
}

export function renderSpacePost(posts: PostsExportType) {
  posts.forEach(({ Component }) => {
    React.createElement(Component);
  });
}

export interface PostPageRenderProps extends IRenderContext, Pick<PostProps, 'post'> {}

export function renderPost({ page, site, post, dev, isPreBuild }: PostPageRenderProps) {
  const html = createPost({
    pageTitle: post.data.title,
    siteTitle: site.title,
    pathname: post.data.pathname,
    author: site.author,
    description: post.data.description,
    publicPath: site.publicPath,
    hmr: dev,
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...layoutUtils.getStyleNames(),
      ...post.utils.getStyleNames(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...layoutUtils.getScriptNames(),
      ...post.utils.getScriptNames(),
    ],
    preloadAssets: [
      ...site.getPreloads(),
      ...page.getPreloads(),
      ...layoutUtils.getPreloadAssets(),
      ...post.utils.getPreloadAssets(),
    ],
    post,
    page,
    site,
    isPreBuild,
  });

  return html;
}
