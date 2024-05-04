import type {
  UrlListData,
  PostListDataWithTitle as PostListData,
  PostExportData,
} from '@blog/types';
import { normalize, normalizeUrl } from '@blog/node';
import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { PostList, ItemList, utils } from '@blog/template-layout';
import { createHtml } from './react';
import { site, archivePath } from '../../constant';

const createYearList = createHtml(ItemList);
const createYearPostList = createHtml(PostList);

interface YearData {
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
    } else {
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

export function getYearListUrlPath(index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath, archivePath)
    : normalizeUrl(Builder.options.publicPath, archivePath, String(index));
}

export function getYearPostListUrlPath(year: string, index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath, archivePath, year)
    : normalizeUrl(Builder.options.publicPath, archivePath, year, String(index));
}

export function getYearListAssetPath(index: number) {
  return normalize(getYearListUrlPath(index), 'index.html');
}

export function getYearPostListAssetPath(tag: string, index: number) {
  return normalize(getYearPostListUrlPath(tag, index), 'index.html');
}

export function renderYearListPage({ index, pathname, data, count, listTitle }: UrlListData) {
  const pageTitle = index === 0 ? '归档聚合页' : `归档聚合 | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createYearList({
    data,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    pre: isEnd ? undefined : getYearListUrlPath(index + 1),
    next: isStart ? undefined : getYearListUrlPath(index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}

export function renderYearPostListPage({ index, pathname, posts, count, listTitle }: PostListData) {
  const pageTitle = index === 0 ? `归档 ${listTitle}` : `归档 ${listTitle} | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createYearPostList({
    posts,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    pre: isEnd ? undefined : getYearListUrlPath(index + 1),
    next: isStart ? undefined : getYearListUrlPath(index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}
