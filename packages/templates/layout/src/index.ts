import { defineUtils, withScriptOptions } from '@blog/context/runtime';
import themeAssets from './components/theme-toggle/theme.script';
import assets from './layout.script';

import './font';

export * from './components/layout';
export * from './components/pagination';
export * from './views/main-index';
export * from './views/item-list';
export * from './views/post-list';
export * from './views/archive-list';

export const utils = defineUtils([
  ...assets,
  ...withScriptOptions(themeAssets, { position: 'head' }),
]);
