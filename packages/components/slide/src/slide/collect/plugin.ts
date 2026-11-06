import { onBuild } from '@blog/context/runtime';
import type { IPage, SlideConfig } from '@blog/types';

/** 预渲染收集的配置，按页面隔离；不保存 React store。 */
export const slideConfigs = new WeakMap<IPage, SlideConfig>();

onBuild((runtime) => {
  runtime.hooks.afterReady.tap('slide:animation', ({ pages }) => {
    for (const page of pages) {
      slideConfigs.delete(page);
    }
  });

  runtime.hooks.beforeBuild.tap('slide:animation', ({ pages }) => {
    for (const page of pages) {
      const config = slideConfigs.get(page);

      if (!config) {
        if (page.type === 'post' && page.data.post.data.template === 'slide') {
          throw new Error('[mdx-slide] PPT 必须包含一个 Slide 和至少一个 Section。');
        }

        continue;
      }

      if (config.sections.some(({ steps }) => steps.length > 0)) {
        page.addBrowserConfig({ slide: config });
      }
    }
  });
});
