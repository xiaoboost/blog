import { normalize, normalizeUrl, toPinyin } from '@blog/node';
import { PostList, ItemList } from '@blog/template-layout';
import type { IRenderContext, ISite, PostExportData } from '@blog/types';
import { pageConfig } from '../constant';
import { Page } from '../model/page';
import { paginate } from '../utils/pagination';
import { createHtml } from '../utils/react';
import { isListedPost } from '../utils/visibility';

const createTagList = createHtml(ItemList);
const createPostList = createHtml(PostList);

export interface TagData {
  name: string;
  posts: PostExportData[];
}

export function getTagData(posts: PostExportData[]) {
  const tags: TagData[] = [];

  for (const post of posts) {
    if (!isListedPost(post)) {
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

export function createTagPages(site: ISite, posts: PostExportData[]) {
  const tags = getTagData(posts);
  const pages = paginate(
    tags,
    pageConfig.archive,
    (i) => getTagListUrlPath(site, i),
    (chunk, nav) => {
      const items = chunk.map(({ name, posts }) => ({
        title: name,
        subTitle: `共 ${posts.length} 篇`,
        url: getTagPostListUrlPath(site, name, 0),
      }));

      return new Page({
        type: 'tag-list',
        pathname: getTagListUrlPath(site, nav.index),
        title: nav.index === 0 ? '标签聚合页' : `标签聚合 | 第 ${nav.index + 1} 页`,
        data: { listTitle: '标签归档', items, ...nav },
        render: renderTagListPage,
      });
    },
  );

  for (const { name, posts: tagPosts } of tags) {
    pages.push(...paginate(
      tagPosts,
      pageConfig.archive,
      (i) => getTagPostListUrlPath(site, name, i),
      (chunk, nav) => new Page({
        type: 'tag-post-list',
        pathname: getTagPostListUrlPath(site, name, nav.index),
        title: nav.index === 0 ? `标签"${name}"` : `标签"${name}" | 第 ${nav.index + 1} 页`,
        data: { listTitle: name, posts: chunk, ...nav },
        render: renderTagPostListPage,
      }),
    ));
  }

  return pages;
}

function renderTagListPage(ctx: IRenderContext<'tag-list'>) {
  const { page, site } = ctx;
  const {
    items,
    index,
    count,
    ...data
  } = page.data;

  return createTagList({
    ...ctx,
    ...data,
    data: items,
    numbered: { index, count, urlForIndex: (i) => getTagListUrlPath(site, i) },
  });
}

function renderTagPostListPage(ctx: IRenderContext<'tag-post-list'>) {
  const { page, site } = ctx;
  const { index, count, ...data } = page.data;

  return createPostList({
    ...ctx,
    ...data,
    numbered: { index, count, urlForIndex: (i) => getTagPostListUrlPath(site, data.listTitle, i) },
  });
}
