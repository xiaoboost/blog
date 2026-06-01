import {
  callHook,
  waitReady,
  Builder,
} from '@blog/context/runtime';
import posts from '@blog/posts';
import type { AssetData, RunnerCb } from '@blog/types';
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
import { paginate } from './utils/pagination';

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

  // 首页列表页面
  allPages.push(...paginate(
    sortedPosts,
    pageConfig.index,
    (i) => getIndexUrlPath(site, i),
    (chunk, nav) =>
      new Page({
        type: 'index',
        pathname: getIndexUrlPath(site, nav.index),
        title: nav.index === 0
          ? siteConfig.title
          : `${siteConfig.title} | 第 ${nav.index + 1} 页`,
        data: { posts: chunk, ...nav },
        render: (props) => renderListPage({
          ...props,
          posts: chunk,
          ...nav,
        }),
      }),
  ));

  const tagsData = getTagData(posts);

  // 标签列表页
  allPages.push(...paginate(
    tagsData,
    pageConfig.archive,
    (i) => getTagListUrlPath(site, i),
    (chunk, nav) => {
      const items = chunk.map((d) => ({
        title: d.name,
        subTitle: `共 ${d.posts.length} 篇`,
        url: getTagPostListUrlPath(site, d.name, 0),
      }));

      return new Page({
        type: 'tag-list',
        pathname: getTagListUrlPath(site, nav.index),
        title: nav.index === 0
          ? '标签聚合页'
          : `标签聚合 | 第 ${nav.index + 1} 页`,
        data: { listTitle: '标签归档', items, ...nav },
        render: (props) => renderTagListPage({
          ...props,
          listTitle: '标签归档',
          data: items,
          ...nav,
        }),
      });
    },
  ));

  // 标签文章列表页
  for (const { name, posts: tagPosts } of tagsData) {
    allPages.push(...paginate(
      tagPosts,
      pageConfig.archive,
      (i) => getTagPostListUrlPath(site, name, i),
      (chunk, nav) =>
        new Page({
          type: 'tag-post-list',
          pathname: getTagPostListUrlPath(site, name, nav.index),
          title: nav.index === 0
            ? `标签"${name}"`
            : `标签"${name}" | 第 ${nav.index + 1} 页`,
          data: { listTitle: name, posts: chunk, ...nav },
          render: (props) => renderTagPostListPage({
            ...props,
            listTitle: name,
            posts: chunk,
            ...nav,
          }),
        }),
    ));
  }

  const yearData = getYearData(posts);

  // 归档列表页
  allPages.push(...paginate(
    yearData,
    pageConfig.archive,
    (i) => getYearListUrlPath(site, i),
    (chunk, nav) => {
      const items = chunk.map((d) => ({
        title: `${d.name} 年`,
        subTitle: `共 ${d.posts.length} 篇`,
        url: getYearPostListUrlPath(site, d.name, 0),
      }));

      return new Page({
        type: 'year-list',
        pathname: getYearListUrlPath(site, nav.index),
        title: nav.index === 0
          ? '归档聚合页'
          : `归档聚合 | 第 ${nav.index + 1} 页`,
        data: { listTitle: '归档汇总', items, ...nav },
        render: (props) => renderYearListPage({
          ...props,
          listTitle: '归档汇总',
          data: items,
          ...nav,
        }),
      });
    },
  ));

  // 归档文章列表页
  for (const { name, posts: yearPosts } of yearData) {
    allPages.push(...paginate(
      yearPosts,
      pageConfig.archive,
      (i) => getYearPostListUrlPath(site, name, i),
      (chunk, nav) =>
        new Page({
          type: 'year-post-list',
          pathname: getYearPostListUrlPath(site, name, nav.index),
          title: nav.index === 0
            ? `归档 ${name}`
            : `归档 ${name} | 第 ${nav.index + 1} 页`,
          data: { listTitle: `${name} 年`, posts: chunk, ...nav },
          render: (props) => renderYearPostListPage({
            ...props,
            listTitle: `${name} 年`,
            posts: chunk,
            ...nav,
          }),
        }),
    ));
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

  assets.push(...site.getAssets());

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

  // 预构建
  const preAssets = await render({ isPreBuild: true, site, allPages });

  // 字体构建等
  await callHook('beforeBuild', ctx);

  // 正式构建
  const htmlAssets = await render({ isPreBuild: false, site, allPages, ctx });
  const staticAssets = assets.concat(preAssets).concat(htmlAssets);
  const allProcessed = await callHook('processAssets', staticAssets);

  await callHook('afterBuild', allProcessed.slice());

  return allProcessed;
};

export default main;
