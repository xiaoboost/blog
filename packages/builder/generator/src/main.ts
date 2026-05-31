import {
  callHook,
  waitReady,
  RuntimeBuilder as Builder,
} from '@blog/context/runtime';
import posts from '@blog/posts';
import type { AssetData, RunnerCb } from '@blog/types';
import { cut } from '@xiao-ai/utils';
import {
  pageConfig,
  site as siteConfig,
  archivePath,
  tagPath,
  aboutPath,
  publicPath,
} from './constant';
import { Page } from './model/page';
import { Site } from './model/site';
import { renderListPage, getIndexUrlPath } from './pages/list';
import { filterSortPosts, getPostUrlPath, renderPost } from './pages/post';
import {
  getTagData,
  renderTagListPage,
  getTagListUrlPath,
  getTagPostListUrlPath,
  renderTagPostListPage,
} from './pages/tag';
import {
  getYearData,
  renderYearListPage,
  getYearListUrlPath,
  getYearPostListUrlPath,
  renderYearPostListPage,
} from './pages/year';

// ── 主流程 ──

interface RenderOptions {
  isPreBuild: boolean;
  site: Site;
  allPages: Page[];
  ctx?: {
    pages: Page[];
    site: Site;
    rename: (asset: AssetData) => string;
    logger: any;
  };
}

function createAllPages(): Omit<RenderOptions, 'isPreBuild'> {
  const site = new Site({
    title: siteConfig.title,
    author: siteConfig.author,
    description: siteConfig.description,
    publicPath,
    aboutPath,
    tagPath,
    archivePath,
  });

  const allPages: Page[] = [];

  // 文章页面
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    // 生成标签链接
    post.data.tags.forEach((tag) => (tag.url = getTagPostListUrlPath(site, tag.name, 0)));
    // 生成页面链接
    post.data.pathname = getPostUrlPath(site, post);

    const page = new Page({
      type: 'post',
      pathname: post.data.pathname,
      title: post.data.title,
      data: { post },
      render: (props) => renderPost({ ...props, post }),
    });

    allPages.push(page);
  }

  const sortedPosts = filterSortPosts(posts);
  const mainLists = cut(sortedPosts, pageConfig.index);

  // 首页列表页面
  for (let i = 0; i < mainLists.length; i++) {
    const isStart = i === 0;
    const isEnd = i === mainLists.length - 1;
    const older = isEnd ? undefined : getIndexUrlPath(site, i + 1);
    const newer = isStart ? undefined : getIndexUrlPath(site, i - 1);

    const d = {
      posts: mainLists[i],
      index: i,
      count: mainLists.length,
      older,
      newer,
    };

    const page = new Page({
      type: 'index',
      pathname: getIndexUrlPath(site, i),
      title: i === 0 ? siteConfig.title : `${siteConfig.title} | 第 ${i + 1} 页`,
      data: d,
      render: (props) => renderListPage({
        ...props,
        posts: d.posts,
        older: d.older,
        newer: d.newer,
        index: d.index,
        count: d.count,
      }),
    });

    allPages.push(page);
  }

  const tagsData = getTagData(posts);
  const tagLists = cut(tagsData, pageConfig.archive);

  // 标签列表页
  for (let i = 0; i < tagLists.length; i++) {
    const isStart = i === 0;
    const isEnd = i === tagLists.length - 1;
    const older = isEnd ? undefined : getTagListUrlPath(site, i + 1);
    const newer = isStart ? undefined : getTagListUrlPath(site, i - 1);

    const d = {
      listTitle: '标签归档',
      items: tagLists[i].map((d) => ({
        title: d.name,
        subTitle: `共 ${d.posts.length} 篇`,
        url: getTagPostListUrlPath(site, d.name, 0),
      })),
      index: i,
      count: tagLists.length,
      older,
      newer,
    };

    const page = new Page({
      type: 'tag-list',
      pathname: getTagListUrlPath(site, i),
      title: i === 0 ? '标签聚合页' : `标签聚合 | 第 ${i + 1} 页`,
      data: d,
      render: (props) => renderTagListPage({
        ...props,
        listTitle: d.listTitle,
        data: d.items,
        older: d.older,
        newer: d.newer,
        index: d.index,
        count: d.count,
      }),
    });

    allPages.push(page);
  }

  // 标签文章列表页
  for (const { name, posts: tagPosts } of tagsData) {
    const postLists = cut(tagPosts, pageConfig.archive);

    for (let i = 0; i < postLists.length; i++) {
      const isStart = i === 0;
      const isEnd = i === postLists.length - 1;
      const older = isEnd ? undefined : getTagPostListUrlPath(site, name, i + 1);
      const newer = isStart ? undefined : getTagPostListUrlPath(site, name, i - 1);

      const d = {
        listTitle: name,
        posts: postLists[i],
        index: i,
        count: postLists.length,
        older,
        newer,
      };

      const page = new Page({
        type: 'tag-post-list',
        pathname: getTagPostListUrlPath(site, name, i),
        title: i === 0 ? `标签"${name}"` : `标签"${name}" | 第 ${i + 1} 页`,
        data: d,
        render: (props) => renderTagPostListPage({
          ...props,
          listTitle: d.listTitle,
          posts: d.posts,
          older: d.older,
          newer: d.newer,
          index: d.index,
          count: d.count,
        }),
      });

      allPages.push(page);
    }
  }

  const yearData = getYearData(posts);
  const yearLists = cut(yearData, pageConfig.archive);

  // 归档列表页
  for (let i = 0; i < yearLists.length; i++) {
    const isStart = i === 0;
    const isEnd = i === yearLists.length - 1;
    const older = isEnd ? undefined : getYearListUrlPath(site, i + 1);
    const newer = isStart ? undefined : getYearListUrlPath(site, i - 1);

    const d = {
      listTitle: '归档汇总',
      items: yearLists[i].map((d) => ({
        title: `${d.name} 年`,
        subTitle: `共 ${d.posts.length} 篇`,
        url: getYearPostListUrlPath(site, d.name, 0),
      })),
      index: i,
      count: yearLists.length,
      older,
      newer,
    };

    const page = new Page({
      type: 'year-list',
      pathname: getYearListUrlPath(site, i),
      title: i === 0 ? '归档聚合页' : `归档聚合 | 第 ${i + 1} 页`,
      data: d,
      render: (props) => renderYearListPage({
        ...props,
        listTitle: d.listTitle,
        data: d.items,
        older: d.older,
        newer: d.newer,
        index: d.index,
        count: d.count,
      }),
    });

    allPages.push(page);
  }

  // 归档文章列表页
  for (const { name, posts: yearPosts } of yearData) {
    const postLists = cut(yearPosts, pageConfig.archive);

    for (let i = 0; i < postLists.length; i++) {
      const isStart = i === 0;
      const isEnd = i === postLists.length - 1;
      const older = isEnd ? undefined : getYearPostListUrlPath(site, name, i + 1);
      const newer = isStart ? undefined : getYearPostListUrlPath(site, name, i - 1);

      const d = {
        listTitle: `${name} 年`,
        posts: postLists[i],
        index: i,
        count: postLists.length,
        older,
        newer,
      };

      const page = new Page({
        type: 'year-post-list',
        pathname: getYearPostListUrlPath(site, name, i),
        title: i === 0 ? `归档 ${name}` : `归档 ${name} | 第 ${i + 1} 页`,
        data: d,
        render: (props) => renderYearPostListPage({
          ...props,
          listTitle: d.listTitle,
          posts: d.posts,
          older: d.older,
          newer: d.newer,
          index: d.index,
          count: d.count,
        }),
      });

      allPages.push(page);
    }
  }

  return { site, allPages };
}

async function render({ isPreBuild, site, allPages, ctx }: RenderOptions): Promise<AssetData[]> {
  const assets: AssetData[] = [];

  for (const page of allPages) {
    if (!isPreBuild && ctx) {
      await callHook('beforePageRender', { ...ctx, page });
    }

    page.html = page.render({ page, site, isPreBuild, dev: Builder.options.hmr });

    if (!isPreBuild && ctx) {
      await callHook('afterPageRender', { ...ctx, page });
    }

    assets.push(page.toAsset());
    assets.push(...page.getAssets());
  }

  return assets;
}

const main: RunnerCb = async (assets) => {
  await waitReady;
  await callHook('beforeStart');

  const { site, allPages } = createAllPages();

  await callHook(
    'afterPostDataReady',
    posts.map(({ data }) => data),
  );

  // 构建上下文
  const ctx = {
    pages: allPages,
    site,
    rename: (asset: AssetData) => Builder.renameAsset(asset) ?? asset.path,
    logger: Builder.logger as any,
  };

  // 实例就绪
  await callHook('afterReady', ctx);

  // PreBuild — discover module dependencies
  const preAssets = await render({ isPreBuild: true, site, allPages });

  // 字体构建等
  await callHook('beforeBuild', ctx);

  // Formal Build — actual page generation
  const htmlAssets = await render({ isPreBuild: false, site, allPages, ctx });
  const allProcessed = await callHook('processAssets', (assets as AssetData[]).concat(preAssets).concat(htmlAssets));
  await callHook('afterBuild', allProcessed.slice());

  return allProcessed;
};

export default main;
