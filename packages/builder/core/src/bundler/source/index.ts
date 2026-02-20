import posts from '@blog/posts';
import type {
  AssetData,
  PostListData,
  UrlListData,
  PostListDataWithTitle,
  RunnerCb,
} from '@blog/types';
import { cut } from '@xiao-ai/utils';
import { callHook, waitReady, nextPhase, resetPhase } from '@blog/context/runtime';
import { renderPost, setPostUrl, getPostAssetPath, filterSortPosts } from './post';
import { renderListPage, getIndexUrlPath, getIndexAssetPath } from './list';
import { pageConfig } from '../../constant';

import * as Tag from './tag';
import * as Year from './year';

interface RenderOptions {
  callHooks: boolean;
}

async function render({ callHooks }: RenderOptions): Promise<AssetData[]> {
  const assets: AssetData[] = [];

  if (callHooks) {
    await callHook('beforeStart');
  }

  setPostUrl(posts);

  if (callHooks) {
    await callHook(
      'afterPostDataReady',
      posts.map(({ data }) => data),
    );
  }

  // 生成文章页面
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    // 生成标签链接
    post.data.tags.forEach((tag) => (tag.url = Tag.getTagPostListUrlPath(tag.name, 0)));
    if (callHooks) {
      await callHook('beforeEachPost', post, i, posts);
    }
    const asset: AssetData = {
      path: getPostAssetPath(post),
      content: Buffer.from(renderPost(post)),
    };
    if (callHooks) {
      await callHook('afterEachPost', asset, i, posts);
    }
    assets.push(asset);
  }

  const sortedPosts = filterSortPosts(posts);
  const mainLists = cut(sortedPosts, pageConfig.index);

  // 生成列表页面
  for (let i = 0; i < mainLists.length; i++) {
    const data: PostListData = {
      index: i,
      count: mainLists.length,
      pathname: getIndexUrlPath(i),
      posts: mainLists[i],
    };

    if (callHooks) {
      await callHook('beforeEachMainIndexList', data);
    }
    const asset: AssetData = {
      path: getIndexAssetPath(i),
      content: Buffer.from(renderListPage(data)),
    };
    if (callHooks) {
      await callHook('afterEachMainIndexList', asset);
    }
    assets.push(asset);
  }

  const tagsData = Tag.getTagData(posts);
  const tagLists = cut(tagsData, pageConfig.archive);

  // 生成标签列表页
  for (let i = 0; i < tagLists.length; i++) {
    const data: UrlListData = {
      index: i,
      count: tagLists.length,
      pathname: Tag.getTagListUrlPath(i),
      listTitle: '标签归档',
      data: tagLists[i].map((data) => ({
        title: data.name,
        subTitle: `共 ${data.posts.length} 篇`,
        url: Tag.getTagPostListUrlPath(data.name, 0),
      })),
    };

    if (callHooks) {
      await callHook('beforeEachTagList', data);
    }
    const asset: AssetData = {
      path: Tag.getTagListAssetPath(i),
      content: Buffer.from(Tag.renderTagListPage(data)),
    };
    if (callHooks) {
      await callHook('afterEachTagList', asset);
    }
    assets.push(asset);
  }

  // 生成标签文章列表页
  for (const { name, posts } of tagsData) {
    const postLists = cut(posts, pageConfig.archive);

    for (let i = 0; i < postLists.length; i++) {
      const data: PostListDataWithTitle = {
        index: i,
        count: postLists.length,
        pathname: Tag.getTagPostListUrlPath(name, i),
        listTitle: name,
        posts: postLists[i],
      };

      if (callHooks) {
        await callHook('beforeEachTagPostList', data);
      }
      const asset: AssetData = {
        path: Tag.getTagPostListAssetPath(name, i),
        content: Buffer.from(Tag.renderTagPostListPage(data)),
      };
      if (callHooks) {
        await callHook('afterEachTagPostList', asset);
      }
      assets.push(asset);
    }
  }

  const yearData = Year.getYearData(posts);
  const yearLists = cut(yearData, pageConfig.archive);

  // 生成归档列表页
  for (let i = 0; i < yearLists.length; i++) {
    const data: UrlListData = {
      index: i,
      count: yearLists.length,
      pathname: Year.getYearListUrlPath(i),
      listTitle: '归档汇总',
      data: yearLists[i].map((data) => ({
        title: `${data.name} 年`,
        subTitle: `共 ${data.posts.length} 篇`,
        url: Year.getYearPostListUrlPath(data.name, 0),
      })),
    };

    if (callHooks) {
      await callHook('beforeEachYearList', data);
    }
    const asset: AssetData = {
      path: Year.getYearListAssetPath(i),
      content: Buffer.from(Year.renderYearListPage(data)),
    };
    if (callHooks) {
      await callHook('afterEachYearList', asset);
    }
    assets.push(asset);
  }

  // 生成归档文章列表页
  for (const { name, posts } of yearData) {
    const postLists = cut(posts, pageConfig.archive);

    for (let i = 0; i < postLists.length; i++) {
      const data: PostListDataWithTitle = {
        index: i,
        count: postLists.length,
        pathname: Year.getYearPostListUrlPath(name, i),
        listTitle: `${name} 年`,
        posts: postLists[i],
      };

      if (callHooks) {
        await callHook('beforeEachYearPostList', data);
      }
      const asset: AssetData = {
        path: Year.getYearPostListAssetPath(name, i),
        content: Buffer.from(Year.renderYearPostListPage(data)),
      };
      if (callHooks) {
        await callHook('afterEachYearPostList', asset);
      }
      assets.push(asset);
    }
  }

  return assets;
}

const main: RunnerCb = async (assets) => {
  resetPhase();

  await waitReady;
  await callHook('beforeStart');

  setPostUrl(posts);

  await callHook(
    'afterPostDataReady',
    posts.map(({ data }) => data),
  );

  nextPhase();

  await callHook('beforePreBuild');
  await render({ callHooks: false });
  const processed = await callHook('afterPreBuild', assets.slice());

  nextPhase();

  const htmlAssets = await render({ callHooks: true });
  const allProcessed = await callHook('processAssets', processed.concat(htmlAssets));
  await callHook('afterBuild', allProcessed.slice());

  nextPhase();

  // 返回所有资源
  return allProcessed;
};

export default main;
