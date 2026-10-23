import { normalize, normalizeUrl } from '@blog/node';
import { Post as PostRender, type PostProps } from '@blog/template-post';
import { SlidePage } from '@blog/template-slide';
import type {
  IRenderContext,
  ISite,
  PostExportDataWithComponent,
  PostsExportType,
} from '@blog/types';
import React from 'react';
import { createHtml } from '../utils/react';

const templates = new Map<string, (props: PostPageRenderProps) => string>([
  ['post', createHtml(PostRender)],
  ['slide', createHtml(SlidePage)],
]);

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

export function renderPost({
  page,
  site,
  post,
  dev,
  isPreBuild,
}: PostPageRenderProps) {
  const render = templates.get(post.data.template);

  if (!render) {
    throw new Error(
      `未知文章模板 ${JSON.stringify(post.data.template)}：${post.data.filePath}（支持：${[...templates.keys()].join(', ')}）`,
    );
  }

  return render({
    post,
    page,
    site,
    dev,
    isPreBuild,
  });
}
