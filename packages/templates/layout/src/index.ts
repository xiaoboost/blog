import { defineUtils } from '@blog/context/runtime';
import './title-font';

import assets from './layout.script';

export * from './components/layout';
export * from './views/main-index';
export * from './views/item-list';
export * from './views/post-list';

export const utils = defineUtils(assets);
