import { normalize, normalizeUrl, toPinyin } from '@blog/node';
import { PostList, ItemList, utils, type ItemListProps, type PostListProps, type PaginationProps } from '@blog/template-layout';
import type { IRenderContext, ISite, PostExportData } from '@blog/types';
import { createHtml } from '../utils/react';

const createTagList = createHtml(ItemList);
const createPostList = createHtml(PostList);

export interface TagData {
  name: string;
  posts: PostExportData[];
}

export function getTagData(posts: PostExportData[]) {
  const tags: TagData[] = [];

  for (const post of posts) {
    if (!post.data.public) {
      continue;
    }

    const postTags = post.data.tags ?? ['无标签'];

    for (const tag of postTags) {
      const data = tags.find((item) => item.name === tag.name);

      if (data) {
        data.posts.push(post);
      }
      else {
        tags.push({ name: tag.name, posts: [post] });
      }
    }
  }

  tags
    .sort((pre, next) => (pre.posts.length > next.posts.length ? -1 : 1))
    .forEach(({ posts }) => {
      posts.sort((pre, next) => {
        const preDate = new Date(pre.data.create).getTime();
        const nextDate = new Date(next.data.create).getTime();
        return preDate > nextDate ? -1 : 1;
      });
    });

  return tags;
}

export function getTagListUrlPath(site: ISite, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath, site.tagPath)
    : normalizeUrl(site.publicPath, site.tagPath, String(index));
}

export function getTagPostListUrlPath(site: ISite, tag: string, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath, site.tagPath, toPinyin(tag))
    : normalizeUrl(site.publicPath, site.tagPath, toPinyin(tag), String(index));
}

export function getTagListAssetPath(site: ISite, index: number) {
  return normalize(getTagListUrlPath(site, index), 'index.html');
}

export function getTagPostListAssetPath(site: ISite, tag: string, index: number) {
  return normalize(getTagPostListUrlPath(site, tag, index), 'index.html');
}

export interface TagListPageRenderProps
  extends IRenderContext, Pick<ItemListProps, 'listTitle' | 'data'>, PaginationProps {
  index: number;
  count: number;
}

export function renderTagListPage({
  page,
  site,
  listTitle,
  data,
  older,
  newer,
  index,
  dev,
  isPreBuild,
}: TagListPageRenderProps) {
  const pageTitle = index === 0 ? '标签聚合页' : `标签聚合 | 第 ${index + 1} 页`;

  return createTagList({
    data,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname: page.pathname,
    publicPath: site.publicPath,
    hmr: dev,
    older,
    newer,
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...utils.getStyleNames(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...utils.getScriptNames(),
    ],
    preloadAssets: [
      ...site.getPreloads(),
      ...page.getPreloads(),
      ...utils.getPreloadAssets(),
    ],
    page,
    site,
    isPreBuild,
  });
}

export interface TagPostListPageRenderProps
  extends IRenderContext, Pick<PostListProps, 'listTitle' | 'posts'>, PaginationProps {
  index: number;
  count: number;
}

export function renderTagPostListPage({
  page,
  site,
  listTitle,
  posts,
  older,
  newer,
  index,
  dev,
  isPreBuild,
}: TagPostListPageRenderProps) {
  const pageTitle = index === 0 ? `标签"${listTitle}"` : `标签"${listTitle}" | 第 ${index + 1} 页`;

  return createPostList({
    posts,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname: page.pathname,
    publicPath: site.publicPath,
    hmr: dev,
    older,
    newer,
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...utils.getStyleNames(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...utils.getScriptNames(),
    ],
    preloadAssets: [
      ...site.getPreloads(),
      ...page.getPreloads(),
      ...utils.getPreloadAssets(),
    ],
    page,
    site,
    isPreBuild,
  });
}
