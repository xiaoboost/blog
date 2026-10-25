import { normalize, normalizeUrl } from '@blog/node';
import { Post as PostRender } from '@blog/template-post';
import { SlidePage } from '@blog/template-slide';
import type {
  IRenderContext,
  ISite,
  PostExportData,
  PostExportDataWithComponent,
  PostsExportType,
} from '@blog/types';
import React from 'react';
import { Page } from '../model/page';
import { createHtml } from '../utils/react';
import { isListedPost } from '../utils/visibility';

const templates = new Map([
  ['post', createHtml(PostRender)],
  ['slide', createHtml(SlidePage)],
]);

export function filterSortPosts(posts: PostExportData[]) {
  return posts
    .filter(isListedPost)
    .sort((pre, next) => (pre.data.create > next.data.create ? -1 : 1));
}

export function getPostUrlPath(site: ISite, post: PostExportDataWithComponent) {
  return normalizeUrl(site.publicPath, post.data.pathname);
}

export function getPostAssetPath(post: PostExportDataWithComponent) {
  return normalize(post.data.pathname, 'index.html');
}

export function createPostPages(posts: PostsExportType) {
  return posts.map((post) => new Page({
    type: 'post',
    pathname: post.data.pathname,
    title: post.data.title,
    data: { post },
    render: renderPost,
  }));
}

export function renderSpacePost(posts: PostsExportType) {
  posts.forEach(({ Component }) => {
    React.createElement(Component);
  });
}

function renderPost(ctx: IRenderContext<'post'>) {
  const { post } = ctx.page.data;
  const render = templates.get(post.data.template);

  if (!render) {
    throw new Error(
      `未知文章模板 ${JSON.stringify(post.data.template)}：${post.data.filePath}（支持：${[...templates.keys()].join(', ')}）`,
    );
  }

  return render({ ...ctx, post });
}
