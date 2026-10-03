import { normalize, normalizeUrl } from '@blog/node';
import { PostList, ArchiveList, utils, type ArchiveListProps, type PostListProps, type PaginationProps } from '@blog/template-layout';
import type { ArchiveYearGroup, IRenderContext, ISite, PostExportData } from '@blog/types';
import { createHtml } from '../utils/react';

const createYearList = createHtml(ArchiveList);
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

export function getArchiveGroups(
  posts: PostExportData[],
  years: YearData[],
  previousPost?: PostExportData,
): ArchiveYearGroup[] {
  const previousYear = previousPost
    ? String(new Date(previousPost.data.create).getFullYear())
    : undefined;
  return getYearData(posts).map(({ name, posts: yearPosts }, index) => ({
    year: name,
    posts: yearPosts,
    total: years.find((year) => year.name === name)!.posts.length,
    continued: index === 0 && previousYear === name,
  }));
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
  extends IRenderContext, Pick<ArchiveListProps, 'listTitle' | 'groups' | 'yearRange'>, PaginationProps {
  index: number;
  count: number;
}

export function renderYearListPage({
  page,
  site,
  listTitle,
  groups,
  yearRange,
  older,
  newer,
  index,
  count,
  dev,
  isPreBuild,
}: YearListPageRenderProps) {
  const pageTitle = index === 0 ? '归档聚合页' : `归档聚合 | 第 ${index + 1} 页`;

  return createYearList({
    groups,
    yearRange,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname: page.pathname,
    publicPath: site.publicPath,
    hmr: dev,
    older,
    newer,
    numbered: { index, count, urlForIndex: (i) => getYearListUrlPath(site, i) },
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...utils.getStyles(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...utils.getScripts(),
    ],
    preScripts: [
      ...site.getPreScripts(),
      ...page.getPreScripts(),
      ...utils.getPreScripts(),
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
  count,
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
    numbered: { index, count, urlForIndex: (i) => getYearPostListUrlPath(site, listTitle, i) },
    styles: [
      ...site.getStyles(),
      ...page.getStyles(),
      ...utils.getStyles(),
    ],
    scripts: [
      ...site.getScripts(),
      ...page.getScripts(),
      ...utils.getScripts(),
    ],
    preScripts: [
      ...site.getPreScripts(),
      ...page.getPreScripts(),
      ...utils.getPreScripts(),
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
