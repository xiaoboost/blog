import { useRenderContext, useRenderOnce } from '@blog/context/runtime';
import { useSlideStore } from './context';
import { slideConfigs } from './plugin';

/** 子元素渲染完成后，把本页完整配置交给构建插件。 */
export function SlideComplete() {
  const context = useRenderContext();
  const store = useSlideStore();

  useRenderOnce(() => {
    if (!context?.isPreBuild) {
      return;
    }

    const { page } = context;

    if (slideConfigs.has(page)) {
      throw new Error('[mdx-slide] 每篇内容只能包含一个 Slide。');
    }

    slideConfigs.set(page, store.getConfig());
  });

  return null;
}
