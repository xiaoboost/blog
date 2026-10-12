import type { IPage } from '@blog/types';
import type { SlideConfig } from './scope';
import { beginCollection, endCollection } from './session';

/**
 * 构建端的同步预渲染入口，不添加 Provider。
 * render 沿用博客 RenderContext，提供同一个 page 和 isPreBuild: true。
 */
export function collectSlide(
  page: IPage,
  render: () => string,
): { html: string; config: SlideConfig } {
  const session = beginCollection(page);
  try {
    const html = render();

    if (typeof html !== 'string') {
      throw new Error('[mdx-slide] 预渲染必须同步返回完整 HTML 字符串。');
    }

    if (!session.slide) {
      throw new Error('[mdx-slide] PPT 必须包含一个 Slide 和至少一个 Section，并提供本页的预渲染 RenderContext。');
    }

    return { html, config: session.slide.getConfig() };
  }
  finally {
    endCollection(page);
  }
}

export type { SlideConfig, SectionConfig } from './scope';
export type { ActionConfig, StepConfig } from '../../animation/types';
