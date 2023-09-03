import posts from '@blog/posts';

import type { AssetData, ListRenderData } from '@blog/types';
import { cut } from '@xiao-ai/utils';
import { callHook, waitReady } from '@blog/context/runtime';
import { renderPost, getPostUrlMap, getPostAssetPath, filterSortPosts } from './post';
import { renderListPage, getIndexUrlPath, getIndexAssetPath } from './list';
import { pageConfig } from '../../constant';

export default async function main() {
  const assets: AssetData[] = [];

  await waitReady;
  await callHook('beforeStart');

  const postUrlMap = getPostUrlMap(posts);
  await callHook('afterPostUrl', postUrlMap);

  // 生成文章页面
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    await callHook('beforeEachPost', post, i, posts);
    const asset: AssetData = {
      path: getPostAssetPath(post),
      content: Buffer.from(renderPost(post)),
    };
    await callHook('afterEachPost', asset, i, posts);
    assets.push(asset);
  }

  const sortedPosts = filterSortPosts(posts);
  const lists = cut(sortedPosts, pageConfig.index);

  // 生成列表页面
  for (let i = 0; i < lists.length; i++) {
    const data: ListRenderData = {
      index: i,
      count: lists.length,
      pathname: getIndexUrlPath(i),
      posts: lists[i],
    };

    await callHook('beforeEachList', data);
    const asset: AssetData = {
      path: getIndexAssetPath(i),
      content: Buffer.from(renderListPage(data)),
    };
    await callHook('afterEachList', asset);
    assets.push(asset);
  }

  const processed = await callHook('processAssets', assets.slice());
  await callHook('afterBuild', processed.slice());

  // 返回所有资源
  return processed;
}
