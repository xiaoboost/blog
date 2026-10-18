import { onBuild } from '@blog/context/runtime';
import { normalize } from '@blog/node';
import type { IPage } from '@blog/types';
import type { SlideConfig } from './scope';

/** 预渲染收集的配置，按页面隔离；不保存 React store。 */
export const slideConfigs = new WeakMap<IPage, SlideConfig>();

onBuild((runtime) => {
  runtime.hooks.afterReady.tap('slide:animation', ({ pages }) => {
    for (const page of pages) {
      slideConfigs.delete(page);
    }
  });

  runtime.hooks.beforeBuild.tap('slide:animation', ({ pages, rename }) => {
    for (const page of pages) {
      const config = slideConfigs.get(page);

      if (!config) {
        if (page.type === 'post' && page.data.post.data.template === 'slide') {
          throw new Error('[mdx-slide] PPT 必须包含一个 Slide 和至少一个 Section。');
        }

        continue;
      }

      // head 中的配置脚本同步执行，确保早于 body 末尾的模板播放脚本。
      const json = JSON.stringify(config);
      const content = Buffer.from(`globalThis.__BLOG_SLIDE_CONFIG__ = ${json};`);
      const asset = { path: 'slide-data.js', content };
      const src = normalize(page.pathname, rename(asset));
      page.addAsset({ path: src, content });
      page.addPreScript({ src });
    }
  });
});
