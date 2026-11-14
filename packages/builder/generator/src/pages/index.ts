import { compareStrings } from '@blog/node';
import type { IPage, ISite, PostsExportType } from '@blog/types';
import { assertUniquePagePaths } from '../utils/page-paths';
import { isListedPost, shouldRenderPost } from '../utils/visibility';
import { createIndexPages } from './list';
import { createNotFoundPage } from './not-found';
import { createPostPages, getPostUrlPath } from './post';
import { createTagPages, getTagPostListUrlPath } from './tag';
import { createYearPages } from './year';

/** 各类页面共享文章对象，在创建页面前统一补齐链接。 */
function preparePostLinks(site: ISite, posts: PostsExportType) {
  for (const post of posts) {
    post.data.tags.forEach((tag) => (tag.url = getTagPostListUrlPath(site, tag.name, 0)));
    post.data.pathname = getPostUrlPath(site, post);
  }
}

export function createPages(site: ISite, posts: PostsExportType): IPage[] {
  // 生成文章链接
  preparePostLinks(site, posts);

  const renderedPosts = posts.filter(shouldRenderPost)
    .sort((a, b) => (
      b.data.create - a.data.create
      || compareStrings(a.data.pathname, b.data.pathname)
    ));
  const listedPosts = renderedPosts.filter(isListedPost);
  const pages = [
    ...createPostPages(renderedPosts),
    ...createIndexPages(site, listedPosts),
    ...createTagPages(site, listedPosts),
    ...createYearPages(site, listedPosts),
    createNotFoundPage(site),
  ];

  assertUniquePagePaths(pages);
  return pages;
}
