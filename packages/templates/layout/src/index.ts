import { defineUtils } from '@blog/context/runtime';

import assets from './layout.script';

export * from './components/layout';
export * from './views/main-index';
export * from './views/post-list';
// export * from './views/tag-list';
// export * from './views/year-list';

export const utils = defineUtils(assets);
