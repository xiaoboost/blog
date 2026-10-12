import { defineUtils } from '@blog/context/runtime';
import assets from './slide.script';
import './font';

export { SlidePage } from './slide';

export const utils = defineUtils(assets);
