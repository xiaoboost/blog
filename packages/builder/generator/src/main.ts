import {
  callHook,
  waitReady,
  Builder,
} from '@blog/context/runtime';
import posts from '@blog/posts';
import type { BuildContext, RunnerCb } from '@blog/types';
import {
  site as siteConfig,
  archivePath,
  tagPath,
  aboutPath,
  publicPath,
} from './constant';
import { Site } from './model/site';
import { createPages } from './pages';
import { renderPages } from './render';

const main: RunnerCb = async (assets) => {
  await waitReady;
  await callHook('beforeStart');

  const site = new Site({
    title: siteConfig.title,
    origin: siteConfig.origin,
    author: siteConfig.author,
    authorUrl: siteConfig.github,
    description: siteConfig.description,
    publicPath,
    aboutPath,
    tagPath,
    archivePath,
  });
  const pages = createPages(site, posts);

  await callHook(
    'afterPostDataReady',
    posts.map(({ data }) => data),
  );

  const ctx: BuildContext = {
    pages,
    site,
    rename: (asset) => Builder.renameAsset(asset) ?? asset.path,
    logger: Builder.logger,
  };

  await callHook('afterReady', ctx);

  // 预渲染收集字体字符，beforeBuild 构建字体，再使用同一批实例正式渲染。
  const preAssets = await renderPages(ctx, {
    isPreBuild: true,
    dev: Builder.options.hmr,
  });
  await callHook('beforeBuild', ctx);
  const htmlAssets = await renderPages(ctx, {
    isPreBuild: false,
    dev: Builder.options.hmr,
  });

  const staticAssets = assets.concat(preAssets).concat(htmlAssets);
  const allProcessed = await callHook('processAssets', staticAssets);
  await callHook('afterBuild', allProcessed.slice());

  return allProcessed;
};

export default main;
