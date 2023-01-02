import { callHook, waitReady } from '@blog/context/runtime';

import { componentReady } from './component';
import { renderPost } from './post';

export default async function main() {
  await waitReady;
  await callHook('beforeStart');
  await componentReady();
  await callHook('afterComponentReady');

  // 获取文章路径到网址的映射
  await callHook('afterPostUrl', new Map());

  for (const item of []) {
    // 编译文章前
    await callHook('beforeEachPost', {} as any);
    // 编译文章
    // 编译文章后
    await callHook('afterEachPost', {} as any);
  }

  for (const item of []) {
    // 编译列表前
    await callHook('beforeEachList', {} as any);
    // 编译列表页面
    // 编译列表后
    await callHook('afterEachList', {} as any);
  }

  await callHook('afterBuild', []);

  // 返回所有资源
  return [];
}
