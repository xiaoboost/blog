import { defineUtils } from '@blog/context/runtime';
import assets from './typo.script';

export { TextGloss, type TextGlossProps } from './text-gloss';
export { Subtitle, type SubtitleProps } from './subtitle';

export const utils = defineUtils(assets);
