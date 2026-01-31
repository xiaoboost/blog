import type {
  UrlListData,
  PostListDataWithTitle as PostListData,
  PostExportData,
} from '@blog/types';
import { normalize, normalizeUrl, toPinyin } from '@blog/node';
import { RuntimeBuilder as Builder } from '@blog/context/runtime';
import { PostList, ItemList, utils } from '@blog/template-layout';
import { createHtml } from './react';
import { site, tagPath } from '../../constant';

const createTagList = createHtml(ItemList);
const createPostList = createHtml(PostList);

interface TagData {
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
      } else {
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

export function getTagListUrlPath(index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath, tagPath)
    : normalizeUrl(Builder.options.publicPath, tagPath, String(index));
}

export function getTagPostListUrlPath(tag: string, index: number) {
  return index === 0
    ? normalizeUrl(Builder.options.publicPath, tagPath, toPinyin(tag))
    : normalizeUrl(Builder.options.publicPath, tagPath, toPinyin(tag), String(index));
}

export function getTagListAssetPath(index: number) {
  return normalize(getTagListUrlPath(index), 'index.html');
}

export function getTagPostListAssetPath(tag: string, index: number) {
  return normalize(getTagPostListUrlPath(tag, index), 'index.html');
}

export function renderTagListPage({ index, pathname, data, count, listTitle }: UrlListData) {
  const pageTitle = index === 0 ? '标签聚合页' : `标签聚合 | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createTagList({
    data,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    pre: isEnd ? undefined : getTagListUrlPath(index + 1),
    next: isStart ? undefined : getTagListUrlPath(index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}

export function renderTagPostListPage({ index, pathname, posts, count, listTitle }: PostListData) {
  const pageTitle = index === 0 ? `标签“${listTitle}”` : `标签“${listTitle}” | 第 ${index + 1} 页`;
  const isStart = index === 0;
  const isEnd = index === count - 1;

  return createPostList({
    posts,
    listTitle,
    siteTitle: site.title,
    pageTitle,
    pathname,
    publicPath: Builder.options.publicPath,
    hmr: Builder.options.hmr,
    pre: isEnd ? undefined : getTagPostListUrlPath(listTitle, index + 1),
    next: isStart ? undefined : getTagPostListUrlPath(listTitle, index - 1),
    styles: utils.getStyleNames(),
    scripts: utils.getScriptNames(),
  });
}
