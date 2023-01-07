import posts from '@blog/posts';

import type { AssetData, ListRenderData } from '@blog/types';
import { cut } from '@xiao-ai/utils';
import { callHook, waitReady } from '@blog/context/runtime';
import { componentReady } from './component';
import { renderPost, getPostUrlMap, getPostAssetPath } from './post';
import { renderListPage, getIndexUrlPath, getIndexAssetPath } from './list';
import { pageConfig } from '../../constant';

export default async function main() {
  const assets: AssetData[] = [];

  await waitReady;
  await callHook('beforeStart');
  await componentReady(posts);
  await callHook('afterComponentReady');

  const postUrlMap = getPostUrlMap(posts);
  await callHook('afterPostUrl', postUrlMap);

  debugger;
  // 生成文章页面
  for (const post of posts) {
    await callHook('beforeEachPost', post);
    const asset: AssetData = {
      path: getPostAssetPath(post),
      content: Buffer.from(renderPost(post)),
    };
    await callHook('afterEachPost', asset);
    assets.push(asset);
  }

  const lists = cut(posts, pageConfig.index);

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

  await callHook('afterBuild', assets.slice());

  // 返回所有资源
  return assets;
}
