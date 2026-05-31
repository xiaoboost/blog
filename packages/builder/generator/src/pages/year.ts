import { normalize, normalizeUrl } from '@blog/node';
import { PostList, ItemList, utils, type ItemListProps, type PostListProps, type PaginationProps } from '@blog/template-layout';
import type { IRenderContext, ISite, PostExportData } from '@blog/types';
import { createHtml } from '../react';

const createYearList = createHtml(ItemList);
const createYearPostList = createHtml(PostList);

export interface YearData {
  name: string;
  posts: PostExportData[];
}

export function getYearData(posts: PostExportData[]) {
  const years: YearData[] = [];

  for (const post of posts) {
    if (!post.data.public) {
      continue;
    }

    const year = String(new Date(post.data.create).getFullYear());
    const data = years.find((item) => item.name === year);

    if (data) {
      data.posts.push(post);
    }
    else {
      years.push({ name: year, posts: [post] });
    }
  }

  years
    .sort((pre, next) => (Number(pre.name) > Number(next.name) ? -1 : 1))
    .forEach(({ posts }) => {
      posts.sort((pre, next) => {
        const preDate = new Date(pre.data.create).getTime();
        const nextDate = new Date(next.data.create).getTime();
        return preDate > nextDate ? -1 : 1;
      });
    });

  return years;
}

export function getYearListUrlPath(site: ISite, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath, site.archivePath)
    : normalizeUrl(site.publicPath, site.archivePath, String(index));
}

export function getYearPostListUrlPath(site: ISite, year: string, index: number) {
  return index === 0
    ? normalizeUrl(site.publicPath, site.archivePath, year)
    : normalizeUrl(site.publicPath, site.archivePath, year, String(index));
}

export function getYearListAssetPath(site: ISite, index: number) {
  return normalize(getYearListUrlPath(site, index), 'index.html');
}

export function getYearPostListAssetPath(site: ISite, year: string, index: number) {
  return normalize(getYearPostListUrlPath(site, year, index), 'index.html');
}

export interface YearListPageRenderProps
  extends IRenderContext, Pick<ItemListProps, 'listTitle' | 'data'>, PaginationProps {
  index: number;
  count: number;
}

export function renderYearListPage({
  page,
  site,
  listTitle,
  data,
  older,
  newer,
  index,
  dev,
  isPreBuild,
}: YearListPageRenderProps) {
  const pageTitle = index === 0 ? '归档聚合页' : `归档聚合 | 第 ${index + 1} 页`;

  return createYearList({
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

export interface YearPostListPageRenderProps
  extends IRenderContext, Pick<PostListProps, 'listTitle' | 'posts'>, PaginationProps {
  index: number;
  count: number;
}

export function renderYearPostListPage({
  page,
  site,
  listTitle,
  posts,
  older,
  newer,
  index,
  dev,
  isPreBuild,
}: YearPostListPageRenderProps) {
  const pageTitle = index === 0 ? `归档 ${listTitle}` : `归档 ${listTitle} | 第 ${index + 1} 页`;

  return createYearPostList({
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
