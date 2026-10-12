import { defineUtils } from '@blog/context/runtime';
import assets from './index.script';

export { Slide } from './slide/slide';
export { Section } from './slide/section';
export type { SlideProps, SectionProps } from './slide/types';
export type { VisualProps, Alignment } from './types';
export * from './layout';
export * from './animation';

export const utils = defineUtils(assets);
