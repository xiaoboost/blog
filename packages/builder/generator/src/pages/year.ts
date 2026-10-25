import { normalize, normalizeUrl } from '@blog/node';
import { PostList, ArchiveList } from '@blog/template-layout';
import type {
  ArchiveYearGroup,
  IRenderContext,
  ISite,
  PostExportData,
} from '@blog/types';
import { pageConfig } from '../constant';
import { Page } from '../model/page';
import { paginate } from '../utils/pagination';
import { createHtml } from '../utils/react';
import { isListedPost } from '../utils/visibility';

const createYearList = createHtml(ArchiveList);
const createYearPostList = createHtml(PostList);

export interface YearData {
  name: string;
  posts: PostExportData[];
}

export function getYearData(posts: PostExportData[]) {
  const years: YearData[] = [];

  for (const post of posts) {
    if (!isListedPost(post)) {
      continue;
    }

    const year = String(new Date(post.data.create).getUTCFullYear());
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
    ? String(new Date(previousPost.data.create).getUTCFullYear())
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

export function createYearPages(
  site: ISite,
  posts: PostExportData[],
  sortedPosts: PostExportData[],
) {
  const years = getYearData(posts);
  const yearRange = years.length ? `${years.at(-1)!.name} — ${years[0].name}` : '';

  // 先按文章数量分页，再在各页内分年份。
  const pages = paginate(
    sortedPosts,
    pageConfig.yearArchive,
    (i) => getYearListUrlPath(site, i),
    (chunk, nav) => {
      const groups = getArchiveGroups(
        chunk,
        years,
        sortedPosts[nav.index * pageConfig.yearArchive - 1],
      );

      return new Page({
        type: 'year-list',
        pathname: getYearListUrlPath(site, nav.index),
        title: nav.index === 0 ? '归档聚合页' : `归档聚合 | 第 ${nav.index + 1} 页`,
        data: {
          listTitle: '旧闻与来处',
          groups,
          yearRange,
          ...nav,
        },
        render: renderYearListPage,
      });
    },
  );

  for (const { name, posts: yearPosts } of years) {
    pages.push(...paginate(
      yearPosts,
      pageConfig.archive,
      (i) => getYearPostListUrlPath(site, name, i),
      (chunk, nav) => new Page({
        type: 'year-post-list',
        pathname: getYearPostListUrlPath(site, name, nav.index),
        title: nav.index === 0 ? `归档 ${name} 年` : `归档 ${name} 年 | 第 ${nav.index + 1} 页`,
        data: {
          year: name,
          listTitle: `${name} 年`,
          posts: chunk,
          ...nav,
        },
        render: renderYearPostListPage,
      }),
    ));
  }

  return pages;
}

function renderYearListPage(ctx: IRenderContext<'year-list'>) {
  const { page, site } = ctx;
  const { index, count, ...data } = page.data;

  return createYearList({
    ...ctx,
    ...data,
    numbered: { index, count, urlForIndex: (i) => getYearListUrlPath(site, i) },
  });
}

function renderYearPostListPage(ctx: IRenderContext<'year-post-list'>) {
  const { page, site } = ctx;
  const {
    year,
    index,
    count,
    ...data
  } = page.data;

  return createYearPostList({
    ...ctx,
    ...data,
    numbered: { index, count, urlForIndex: (i) => getYearPostListUrlPath(site, year, i) },
  });
}
