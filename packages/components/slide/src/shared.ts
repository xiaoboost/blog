import type { StepConfig } from './animation/types';

export const SlideWidth = 1920;
export const SlideHeight = 1080;

export const SlideConfigReadyEvent = 'blog:slide-config-ready';
export const SlideConfigGlobalKey = '__BLOG_SLIDE_CONFIG__';

export interface SectionConfig {
  steps: StepConfig[];
}

/** PPT 配置 */
export interface SlideConfig {
  sections: SectionConfig[];
}
