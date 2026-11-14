import { onBuildWithRender, useRenderOnce } from '@blog/context/runtime';
import type { IPage } from '@blog/types';
import type { ISlideStore } from './context';

/** 登记预渲染 store，并在构建阶段生成页面配置 */
export const useRegisterSlide = onBuildWithRender<ISlideStore>(({ hooks }) => {
  const slideStores = new WeakMap<IPage, ISlideStore>();

  hooks.afterReady.tap('slide:animation', ({ pages }) => {
    for (const page of pages) {
      slideStores.delete(page);
    }
  });

  hooks.beforeBuild.tap('slide:animation', ({ pages }) => {
    for (const page of pages) {
      const store = slideStores.get(page);

      if (!store) {
        if (page.type === 'post' && page.data.post.data.template === 'slide') {
          throw new Error('[mdx-slide] PPT 必须包含一个 Slide 和至少一个 Section。');
        }

        continue;
      }

      const config = store.getConfig();

      if (config.sections.some(({ steps }) => steps.length > 0)) {
        page.addBrowserConfig({ slide: config });
      }
    }
  });

  return function useRegister(store, { page, isPreBuild }) {
    useRenderOnce(() => {
      if (!isPreBuild) {
        return;
      }

      if (slideStores.has(page)) {
        throw new Error('[mdx-slide] 每篇内容只能包含一个 Slide。');
      }

      slideStores.set(page, store);
    });
  };
});
